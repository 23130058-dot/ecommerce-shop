package com.example.ecommerceshop.owner;

import com.example.ecommerceshop.owner.OwnerDtos.BookingResponse;
import com.example.ecommerceshop.owner.OwnerDtos.CreateProductRequest;
import com.example.ecommerceshop.owner.OwnerDtos.ProductResponse;
import com.example.ecommerceshop.owner.OwnerDtos.DailyRevenue;
import com.example.ecommerceshop.owner.OwnerDtos.ProductRevenue;
import com.example.ecommerceshop.owner.OwnerDtos.RevenueResponse;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

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

    @Transactional
    public ProductResponse updateProduct(long ownerId, long productId, CreateProductRequest request) {
        Integer ownedProductCount = jdbc.queryForObject(
                "SELECT COUNT(*) FROM products WHERE id = ? AND owner_id = ?", Integer.class, productId, ownerId);
        if (ownedProductCount == null || ownedProductCount == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy thiết bị của bạn.");
        }
        if (request.dailyPrice() == null || request.quantity() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng nhập giá thuê và số lượng thiết bị.");
        }

        String status = request.status() == null || request.status().isBlank()
                ? "ACTIVE" : request.status().trim().toUpperCase(Locale.ROOT);
        if (!List.of("ACTIVE", "INACTIVE").contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trạng thái thiết bị không hợp lệ.");
        }
        String categorySlug = request.category().trim().toLowerCase(Locale.ROOT);
        if ("drone".equals(categorySlug)) categorySlug = "studio";
        List<Long> categoryIds = jdbc.query("SELECT id FROM categories WHERE slug = ? ORDER BY id LIMIT 1",
                (rs, rowNum) -> rs.getLong(1), categorySlug);
        if (categoryIds.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Danh mục thiết bị không tồn tại.");
        }

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
        String itemType = request.type() == null || request.type().isBlank()
                ? request.name().trim() : request.type().trim();
        String tags = request.tags() == null ? "" : request.tags().trim().replace(',', '|');
        int changed = jdbc.update("""
                UPDATE products
                SET category_id = ?, brand_id = ?, name = ?, description = ?, daily_price = ?,
                    deposit_amount = ?, stock = ?, status = ?, item_type = ?, tags = ?
                WHERE id = ? AND owner_id = ?
                """, categoryIds.get(0), brandId, request.name().trim(),
                request.description() == null ? "" : request.description().trim(), request.dailyPrice(),
                request.depositAmount() == null ? BigDecimal.ZERO : request.depositAmount(),
                request.quantity(), status, itemType, tags, productId, ownerId);
        if (changed == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy thiết bị của bạn.");
        }

        if (!imageUrl.isBlank()) {
            int imageChanged = jdbc.update("""
                    UPDATE product_images SET image_url = ?, is_primary = TRUE
                    WHERE id = (SELECT id FROM product_images WHERE product_id = ?
                                ORDER BY is_primary DESC NULLS LAST, id LIMIT 1)
                    """, imageUrl, productId);
            if (imageChanged == 0) {
                jdbc.update("INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, TRUE)",
                        productId, imageUrl);
            }
        }

        return getProducts(ownerId).stream().filter(product -> product.id().equals(productId)).findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không tải được thiết bị vừa cập nhật."));
    }

    @Transactional(readOnly = true)
    public RevenueResponse getRevenue(long ownerId, LocalDate from, LocalDate to) {
        if (from == null || to == null || to.isBefore(from)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Khoảng ngày lọc doanh thu không hợp lệ.");
        }
        if (ChronoUnit.DAYS.between(from, to) > 365) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng chọn khoảng thời gian tối đa 366 ngày.");
        }

        List<DailyRevenue> daily = jdbc.query("""
                WITH dates AS (
                    SELECT generate_series(CAST(? AS date), CAST(? AS date), interval '1 day')::date AS revenue_date
                ), paid_rentals AS (
                    SELECT rental_id, MIN(paid_at) AS paid_at
                    FROM payments
                    WHERE UPPER(COALESCE(status, '')) IN ('PAID', 'SUCCESS', 'COMPLETED')
                      AND paid_at >= CAST(? AS date)
                      AND paid_at < CAST(? AS date) + interval '1 day'
                    GROUP BY rental_id
                ), owner_daily AS (
                    SELECT paid_rentals.paid_at::date AS revenue_date,
                           COALESCE(SUM(ri.subtotal), 0) AS amount
                    FROM paid_rentals
                    JOIN rental_items ri ON ri.rental_id = paid_rentals.rental_id
                    JOIN products p ON p.id = ri.product_id
                    WHERE p.owner_id = ? AND UPPER(COALESCE(ri.status,'')) <> 'CANCELLED'
                    GROUP BY paid_rentals.paid_at::date
                )
                SELECT dates.revenue_date, COALESCE(owner_daily.amount, 0) AS amount
                FROM dates LEFT JOIN owner_daily USING (revenue_date)
                ORDER BY dates.revenue_date
                """, (rs, rowNum) -> new DailyRevenue(rs.getDate("revenue_date").toLocalDate(),
                rs.getBigDecimal("amount")), from, to, from, to, ownerId);

        List<ProductRevenue> productRevenue = jdbc.query("""
                WITH paid_rentals AS (
                    SELECT rental_id
                    FROM payments
                    WHERE UPPER(COALESCE(status, '')) IN ('PAID', 'SUCCESS', 'COMPLETED')
                      AND paid_at >= CAST(? AS date)
                      AND paid_at < CAST(? AS date) + interval '1 day'
                    GROUP BY rental_id
                )
                SELECT p.id AS product_id, p.name, p.item_type AS type,
                       COALESCE(image.image_url, '') AS image_key, p.daily_price,
                       COALESCE(SUM(CASE WHEN paid_rentals.rental_id IS NOT NULL AND UPPER(COALESCE(ri.status,'')) <> 'CANCELLED' THEN ri.subtotal ELSE 0 END), 0) AS amount,
                       COUNT(DISTINCT CASE WHEN UPPER(COALESCE(ri.status,'')) <> 'CANCELLED' THEN paid_rentals.rental_id END) AS paid_rental_count
                FROM products p
                LEFT JOIN rental_items ri ON ri.product_id = p.id
                LEFT JOIN paid_rentals ON paid_rentals.rental_id = ri.rental_id
                LEFT JOIN LATERAL (
                    SELECT image_url FROM product_images WHERE product_id = p.id
                    ORDER BY is_primary DESC NULLS LAST, id LIMIT 1
                ) image ON TRUE
                WHERE p.owner_id = ? AND UPPER(COALESCE(ri.status,'')) <> 'CANCELLED'
                GROUP BY p.id, p.name, p.item_type, p.daily_price, image.image_url
                ORDER BY amount DESC, p.name
                """, (rs, rowNum) -> new ProductRevenue(rs.getLong("product_id"), rs.getString("name"),
                rs.getString("type"), rs.getString("image_key"), rs.getBigDecimal("daily_price"),
                rs.getBigDecimal("amount"), rs.getLong("paid_rental_count")), from, to, ownerId);

        BigDecimal totalRevenue = daily.stream().map(DailyRevenue::amount).filter(amount -> amount != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        Long paidRentalCount = jdbc.queryForObject("""
                SELECT COUNT(DISTINCT paid_rentals.rental_id)
                FROM (
                    SELECT rental_id FROM payments
                    WHERE UPPER(COALESCE(status, '')) IN ('PAID', 'SUCCESS', 'COMPLETED')
                      AND paid_at >= CAST(? AS date)
                      AND paid_at < CAST(? AS date) + interval '1 day'
                    GROUP BY rental_id
                ) paid_rentals
                JOIN rental_items ri ON ri.rental_id = paid_rentals.rental_id
                JOIN products p ON p.id = ri.product_id
                WHERE p.owner_id = ? AND UPPER(COALESCE(ri.status,'')) <> 'CANCELLED'
                """, Long.class, from, to, ownerId);
        Long productCount = jdbc.queryForObject("SELECT COUNT(*) FROM products WHERE owner_id = ?", Long.class, ownerId);
        return new RevenueResponse(from, to, totalRevenue, paidRentalCount == null ? 0 : paidRentalCount,
                productCount == null ? 0 : productCount, daily, productRevenue);
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
                WHERE p.owner_id = ? AND UPPER(COALESCE(ri.status,'')) <> 'CANCELLED'
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
        if (changed > 0) jdbc.update("""
                INSERT INTO user_notifications(user_id,type,title,message,target_url)
                SELECT renter_id,'BOOKING','Thiết bị đã được Owner xác nhận',
                       'Đơn thuê '||COALESCE(rental_code,'#'||id::text)||' đã được xác nhận.','/renter/orders/'||id
                FROM rentals WHERE id=?
                """,rentalId);
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
        jdbc.update("""
                INSERT INTO user_notifications(user_id,type,title,message,target_url)
                SELECT renter_id,'RETURN','Owner đã hoàn tất trả thiết bị',
                       'Quy trình hoàn trả cho đơn '||COALESCE(rental_code,'#'||id::text)||' đã được cập nhật.','/renter/orders/'||id
                FROM rentals WHERE id=?
                """,rentalId);
    }
}
