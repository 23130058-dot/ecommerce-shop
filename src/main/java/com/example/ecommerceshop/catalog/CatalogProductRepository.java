package com.example.ecommerceshop.catalog;

import com.example.ecommerceshop.user.User;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CatalogProductRepository extends Repository<User, Long> {
    @Query(value = """
            SELECT p.id AS id,
                   p.name AS name,
                   p.item_type AS type,
                   c.slug AS category,
                   b.name AS brand,
                   p.rating AS rating,
                   p.tags AS tags,
                   p.daily_price AS price,
                   COALESCE(image.image_url, '') AS "imageKey",
                   GREATEST(COALESCE(p.stock, 0) - COALESCE((
                       SELECT SUM(ci.quantity)
                       FROM cart_items ci
                       WHERE ci.product_id = p.id AND ci.reserved_until > CURRENT_TIMESTAMP
                   ), 0), 0) AS stock
            FROM products p
            JOIN categories c ON c.id = p.category_id
            LEFT JOIN brands b ON b.id = p.brand_id
            LEFT JOIN LATERAL (
                SELECT pi.image_url
                FROM product_images pi
                WHERE pi.product_id = p.id
                ORDER BY pi.is_primary DESC NULLS LAST, pi.id
                LIMIT 1
            ) image ON TRUE
            WHERE p.status = 'ACTIVE'
              AND (:search = '' OR lower(concat_ws(' ', p.name, p.description, p.item_type,
                                                   c.name, b.name, p.tags))
                   LIKE concat('%', lower(:search), '%'))
              AND (:category = '' OR c.slug = :category)
            ORDER BY CASE WHEN :sort = 'price' THEN p.daily_price END ASC NULLS LAST,
                     CASE WHEN :sort = 'newest' THEN p.created_at END DESC NULLS LAST,
                     CASE WHEN :sort = 'popular' THEN p.featured_order END ASC NULLS LAST,
                     CASE WHEN :sort = 'best-selling' THEN COALESCE((
                         SELECT SUM(ri.quantity) FROM rental_items ri
                         WHERE ri.product_id=p.id
                           AND UPPER(COALESCE(ri.status,'')) NOT IN ('CANCELLED','CANCELED')
                           AND EXISTS (SELECT 1 FROM payments pay WHERE pay.rental_id=ri.rental_id
                                       AND UPPER(COALESCE(pay.status,'')) IN ('PAID','SUCCESS','COMPLETED'))
                     ),0) END DESC,
                     p.created_at DESC,
                     p.id DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<CatalogProductProjection> searchCatalog(
            @Param("search") String search,
            @Param("category") String category,
            @Param("sort") String sort,
            @Param("limit") int limit);

    @Query(value = """
            SELECT p.id AS id,
                   p.name AS name,
                   p.item_type AS type,
                   c.slug AS category,
                   c.name AS "categoryName",
                   b.name AS brand,
                   p.description AS description,
                   p.rating AS rating,
                   p.tags AS tags,
                   p.daily_price AS price,
                   p.deposit_amount AS "depositAmount",
                   COALESCE(image.image_url, '') AS "imageKey",
                   COALESCE(NULLIF(owner.full_name, ''), 'Chủ thiết bị LensRent') AS "ownerName",
                   p.owner_id AS "ownerId",
                   COALESCE(store.store_name,COALESCE(NULLIF(owner.full_name,''),'LensRent')||' Studio') AS "storeName",
                   GREATEST(COALESCE(p.stock, 0) - COALESCE((
                       SELECT SUM(ci.quantity)
                       FROM cart_items ci
                       WHERE ci.product_id = p.id AND ci.reserved_until > CURRENT_TIMESTAMP
                   ), 0), 0) AS stock
            FROM products p
            JOIN categories c ON c.id = p.category_id
            LEFT JOIN brands b ON b.id = p.brand_id
            LEFT JOIN users owner ON owner.id = p.owner_id
            LEFT JOIN owner_stores store ON store.owner_id=p.owner_id
            LEFT JOIN LATERAL (
                SELECT pi.image_url
                FROM product_images pi
                WHERE pi.product_id = p.id
                ORDER BY pi.is_primary DESC NULLS LAST, pi.id
                LIMIT 1
            ) image ON TRUE
            WHERE p.id = :id AND p.status = 'ACTIVE'
            """, nativeQuery = true)
    Optional<CatalogProductDetailProjection> findActiveProductDetail(@Param("id") long id);

    @Query(value = """
            SELECT pi.image_url
            FROM product_images pi
            WHERE pi.product_id = :id
            ORDER BY pi.is_primary DESC NULLS LAST, pi.id
            """, nativeQuery = true)
    List<String> findProductImages(@Param("id") long id);
}
