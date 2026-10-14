package com.example.ecommerceshop.catalog;

import com.example.ecommerceshop.user.User;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CatalogProductRepository extends Repository<User, Long> {
    @Query(value = """
            SELECT p.id AS id,
                   p.name AS name,
                   p.item_type AS type,
                   c.slug AS category,
                   p.rating AS rating,
                   p.tags AS tags,
                   p.daily_price AS price,
                   COALESCE(image.image_url, '') AS "imageKey",
                   COALESCE(p.stock, 0) AS stock
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
                     p.created_at DESC,
                     p.id DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<CatalogProductProjection> searchCatalog(
            @Param("search") String search,
            @Param("category") String category,
            @Param("sort") String sort,
            @Param("limit") int limit);
}