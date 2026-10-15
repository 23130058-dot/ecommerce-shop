package com.example.ecommerceshop.owner;

import com.example.ecommerceshop.owner.OwnerDtos.BookingResponse;
import com.example.ecommerceshop.owner.OwnerDtos.CreateProductRequest;
import com.example.ecommerceshop.owner.OwnerDtos.ProductResponse;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

@Service
public class OwnerService {
    private final JdbcTemplate jdbc;

    public OwnerService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getProducts(long ownerId) {
        return jdbc.query("""
                SELECT p.id, p.name, p.item_type, c.slug AS category, c.name AS category_name,
                       b.name AS brand, p.description, p.tags, p.rating, p.daily_price,
                       p.deposit_amount, COALESCE(image.image_url, '') AS image_key,
                       COALESCE(p.stock, 0) AS available_quantity,
                       COALESCE(rented.quantity, 0)::integer AS rented_quantity,
                       p.status, p.created_at
                FROM products p
                JOIN categories c ON c.id = p.category_id
                LEFT JOIN brands b ON b.id = p.brand_id
                LEFT JOIN LATERAL (
                    SELECT image_url FROM product_images WHERE product_id = p.id
                    ORDER BY is_primary DESC NULLS LAST, id LIMIT 1
                ) image ON TRUE
                LEFT JOIN LATERAL (
                    SELECT SUM(ri.quantity) AS quantity
                    FROM rental_items ri JOIN rentals r ON r.id = ri.rental_id
                    WHERE ri.product_id = p.id
                      AND UPPER(COALESCE(ri.status, r.status, '')) IN (
                          'PENDING', 'CONFIRMED', 'ACTIVE', 'IN_PROGRESS', 'RENTING',
                          'RETURN_PENDING', 'RETURN_REQUESTED', 'AWAITING_RETURN'
                      )
                ) rented ON TRUE
                WHERE p.owner_id = ?
                ORDER BY p.created_at DESC, p.id DESC
                """, (rs, rowNum) -> new ProductResponse(
                rs.getLong("id"), rs.getString("name"), rs.getString("item_type"),
                rs.getString("category"), rs.getString("category_name"), rs.getString("brand"),
                rs.getString("description"), rs.getString("tags"), rs.getBigDecimal("rating"),
                rs.getBigDecimal("daily_price"), rs.getBigDecimal("deposit_amount"),
                rs.getString("image_key"), rs.getInt("available_quantity"), rs.getInt("rented_quantity"),
                rs.getString("status"), rs.getTimestamp("created_at") == null ? null : rs.getTimestamp("created_at").toLocalDateTime()
        ), ownerId);
    }

    @Transactional
    public ProductResponse createProduct(long ownerId, CreateProductRequest request) {
        String status = request.status() == null || request.status().isBlank()
                ? "ACTIVE" : request.status().trim().toUpperCase(Locale.ROOT);
        if (!List.of("ACTIVE", "INACTIVE").contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trạng thái thiết bị không hợp lệ.");
        }
        if (request.dailyPrice() == null || request.quantity() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng nhập giá thuê và số lượng thiết bị.");
        }
        String categorySlug = request.category().trim().toLowerCase(Locale.ROOT);
        if ("drone".equals(categorySlug)) categorySlug = "studio";
        List<Long> categoryIds = jdbc.query("SELECT id FROM categories WHERE slug = ? ORDER BY id LIMIT 1",
                (rs, rowNum) -> rs.getLong(1), categorySlug);
        if (categoryIds.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Danh mục thiết bị không tồn tại.");

        Long brandId = null;
        String brand = request.brand() == null ? "" : request.brand().trim();
        if (!brand.isBlank()) {
            List<Long> brandIds = jdbc.query("SELECT id FROM brands WHERE lower(name) = lower(?) ORDER BY id LIMIT 1",
                    (rs, rowNum) -> rs.getLong(1), brand);
            brandId = brandIds.isEmpty()
                    ? jdbc.queryForObject("INSERT INTO brands (name) VALUES (?) RETURNING id", Long.class, brand)
                    : brandIds.get(0);
        }

        String imageUrl = request.imageUrl() == null ? "" : request.imageUrl().trim();
        if (imageUrl.length() > 7_000_000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ảnh quá lớn. Vui lòng chọn ảnh dưới 5 MB.");
        }
        String tags = request.tags() == null ? "" : request.tags().trim().replace(',', '|');
        String itemType = request.type() == null || request.type().isBlank()
                ? request.name().trim() : request.type().trim();
        Long productId = jdbc.queryForObject("""
                INSERT INTO products (owner_id, category_id, brand_id, name, description, daily_price,
                                      deposit_amount, stock, status, item_type, tags, rating, featured_order)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 5.0, 100)
                RETURNING id
                """, Long.class, ownerId, categoryIds.get(0), brandId, request.name().trim(),
                request.description() == null ? "" : request.description().trim(), request.dailyPrice(),
                request.depositAmount() == null ? java.math.BigDecimal.ZERO : request.depositAmount(),
                request.quantity(), status, itemType, tags);
        if (!imageUrl.isBlank()) {
            jdbc.update("INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, TRUE)", productId, imageUrl);
        }
        return getProducts(ownerId).stream().filter(product -> product.id().equals(productId)).findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không tải được thiết bị vừa tạo."));
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getBookings(long ownerId) {
        return jdbc.query("""
                SELECT r.id AS rental_id, r.rental_code, COALESCE(u.full_name, 'Khách thuê') AS renter_name,
                       COALESCE(u.phone, r.contact_phone, '') AS renter_phone,
                       STRING_AGG(p.name || ' × ' || ri.quantity, ', ' ORDER BY ri.id) AS product_names,
                       MIN(ri.start_date) AS start_date, MAX(ri.end_date) AS end_date,
                       COALESCE(SUM(ri.subtotal), 0) AS rental_amount,
                       COALESCE(SUM(p.deposit_amount * ri.quantity), 0) AS deposit_amount,
                       CASE
                           WHEN BOOL_AND(UPPER(COALESCE(ri.status, r.status, '')) = 'COMPLETED') THEN 'COMPLETED'
                           WHEN BOOL_AND(UPPER(COALESCE(ri.status, r.status, '')) IN ('CONFIRMED', 'ACTIVE', 'IN_PROGRESS', 'RENTING')) THEN 'CONFIRMED'
                           WHEN BOOL_OR(UPPER(COALESCE(ri.status, r.status, '')) IN ('ACTIVE', 'IN_PROGRESS', 'RENTING')) THEN 'ACTIVE'
                           WHEN BOOL_OR(UPPER(COALESCE(ri.status, r.status, '')) = 'PENDING') THEN 'PENDING'
                           ELSE MAX(r.status)
                       END AS status,
                       COALESCE(payment.status, 'UNPAID') AS payment_status,
                       r.created_at
                FROM rentals r
                JOIN users u ON u.id = r.renter_id
                JOIN rental_items ri ON ri.rental_id = r.id
                JOIN products p ON p.id = ri.product_id
                LEFT JOIN LATERAL (
                    SELECT status FROM payments WHERE rental_id = r.id ORDER BY id DESC LIMIT 1
                ) payment ON TRUE
                WHERE p.owner_id = ?
                GROUP BY r.id, r.rental_code, u.full_name, u.phone, r.contact_phone,
                         payment.status, r.created_at
                ORDER BY r.created_at DESC, r.id DESC
                """, (rs, rowNum) -> new BookingResponse(
                rs.getLong("rental_id"), rs.getString("rental_code"), rs.getString("renter_name"),
                rs.getString("renter_phone"), rs.getString("product_names"),
                rs.getDate("start_date") == null ? null : rs.getDate("start_date").toLocalDate(),
                rs.getDate("end_date") == null ? null : rs.getDate("end_date").toLocalDate(),
                rs.getBigDecimal("rental_amount"), rs.getBigDecimal("deposit_amount"),
                rs.getString("status"), rs.getString("payment_status"),
                rs.getTimestamp("created_at") == null ? null : rs.getTimestamp("created_at").toLocalDateTime()
        ), ownerId);
    }

    @Transactional
    public void confirmBooking(long ownerId, long rentalId) {
        int changed = jdbc.update("""
                UPDATE rental_items ri SET status = 'CONFIRMED'
                FROM products p
                WHERE ri.rental_id = ? AND p.id = ri.product_id AND p.owner_id = ?
                  AND UPPER(COALESCE(ri.status, 'PENDING')) = 'PENDING'
                """, rentalId, ownerId);
        Integer ownedItems = jdbc.queryForObject("""
                SELECT COUNT(*) FROM rental_items ri JOIN products p ON p.id = ri.product_id
                WHERE ri.rental_id = ? AND p.owner_id = ?
                """, Integer.class, rentalId, ownerId);
        if (ownedItems == null || ownedItems == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn thuê.");
        if (changed == 0) {
            Integer alreadyConfirmed = jdbc.queryForObject("""
                    SELECT COUNT(*) FROM rental_items ri JOIN products p ON p.id = ri.product_id
                    WHERE ri.rental_id = ? AND p.owner_id = ?
                      AND UPPER(COALESCE(ri.status, '')) IN ('CONFIRMED', 'ACTIVE', 'IN_PROGRESS', 'RENTING')
                    """, Integer.class, rentalId, ownerId);
            if (alreadyConfirmed == null || alreadyConfirmed == 0) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Đơn thuê không còn ở trạng thái chờ xác nhận.");
            }
        }
        jdbc.update("""
                UPDATE rentals SET status = 'CONFIRMED'
                WHERE id = ? AND UPPER(COALESCE(status, '')) = 'PENDING'
                  AND NOT EXISTS (SELECT 1 FROM rental_items WHERE rental_id = rentals.id
                                  AND UPPER(COALESCE(status, 'PENDING')) = 'PENDING')
                """, rentalId);
    }

    @Transactional
    public void completeBooking(long ownerId, long rentalId) {
        Map<Long, Integer> returnedQuantities = jdbc.query("""
                UPDATE rental_items ri SET status = 'COMPLETED'
                FROM products p
                WHERE ri.rental_id = ? AND p.id = ri.product_id AND p.owner_id = ?
                  AND UPPER(COALESCE(ri.status, '')) IN (
                      'CONFIRMED', 'ACTIVE', 'IN_PROGRESS', 'RENTING',
                      'RETURN_PENDING', 'RETURN_REQUESTED', 'AWAITING_RETURN'
                  )
                RETURNING ri.product_id, ri.quantity
                """, rs -> {
            Map<Long, Integer> quantities = new LinkedHashMap<>();
            while (rs.next()) quantities.merge(rs.getLong("product_id"), rs.getInt("quantity"), Integer::sum);
            return quantities;
        }, rentalId, ownerId);

        if (returnedQuantities.isEmpty()) {
            Integer ownedItems = jdbc.queryForObject("""
                    SELECT COUNT(*) FROM rental_items ri JOIN products p ON p.id = ri.product_id
                    WHERE ri.rental_id = ? AND p.owner_id = ?
                    """, Integer.class, rentalId, ownerId);
            if (ownedItems == null || ownedItems == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn thuê.");
            Integer alreadyReturned = jdbc.queryForObject("""
                    SELECT COUNT(*) FROM rental_items ri JOIN products p ON p.id = ri.product_id
                    WHERE ri.rental_id = ? AND p.owner_id = ? AND ri.status = 'COMPLETED'
                    """, Integer.class, rentalId, ownerId);
            if (alreadyReturned == null || alreadyReturned == 0) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Thiết bị chưa được xác nhận cho thuê hoặc không thể hoàn tất.");
            }
            return;
        }

        returnedQuantities.forEach((productId, quantity) -> jdbc.update(
                "UPDATE products SET stock = COALESCE(stock, 0) + ? WHERE id = ? AND owner_id = ?",
                quantity, productId, ownerId));
        jdbc.update("""
                UPDATE rentals SET status = 'COMPLETED'
                WHERE id = ? AND NOT EXISTS (
                    SELECT 1 FROM rental_items WHERE rental_id = rentals.id
                      AND UPPER(COALESCE(status, '')) NOT IN ('COMPLETED', 'CANCELLED', 'CANCELED', 'REJECTED')
                )
                """, rentalId);
    }
}
