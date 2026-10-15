package com.example.ecommerceshop.shopping;

import com.example.ecommerceshop.shopping.ShoppingDtos.CartResponse;
import com.example.ecommerceshop.shopping.ShoppingDtos.CheckoutResponse;
import com.example.ecommerceshop.shopping.ShoppingDtos.ItemRequest;
import com.example.ecommerceshop.shopping.ShoppingDtos.CartUpdateRequest;
import com.example.ecommerceshop.shopping.ShoppingDtos.ShoppingItemResponse;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

import static com.example.ecommerceshop.shopping.ShoppingDtos.*;

@Service
public class ShoppingService {
    private static final int MAX_COMPARE_ITEMS = 4;
    private static final BigDecimal SERVICE_FEE_RATE = new BigDecimal("0.05");
    private static final String PRODUCT_COLUMNS = """
            p.id AS product_id, p.name, p.item_type AS type, c.slug AS category,
            c.name AS category_name, b.name AS brand, p.rating, p.tags,
            p.daily_price AS price, p.deposit_amount AS deposit_amount,
            COALESCE(image.image_url, '') AS image_key, COALESCE(p.stock, 0) AS available_quantity,
            p.status AS product_status
            """;
    private static final String PRODUCT_JOINS = """
            FROM products p
            JOIN categories c ON c.id = p.category_id
            LEFT JOIN brands b ON b.id = p.brand_id
            LEFT JOIN LATERAL (
                SELECT pi.image_url FROM product_images pi
                WHERE pi.product_id = p.id
                ORDER BY pi.is_primary DESC NULLS LAST, pi.id LIMIT 1
            ) image ON TRUE
            """;
    private final JdbcTemplate jdbc;

    public ShoppingService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional(readOnly = true)
    public List<ShoppingItemResponse> getWishlist(long userId) {
        return jdbc.query("SELECT wi.id AS item_id, wi.product_id, " + PRODUCT_COLUMNS +
                PRODUCT_JOINS + " JOIN wishlist_items wi ON wi.product_id = p.id " +
                "WHERE wi.user_id = ? AND p.status = 'ACTIVE' ORDER BY wi.created_at DESC, wi.id DESC",
                itemMapper(false), userId);
    }

    @Transactional
    public void addWishlist(long userId, long productId) {
        requireActiveProduct(productId);
        jdbc.update("INSERT INTO wishlist_items (user_id, product_id) VALUES (?, ?) ON CONFLICT (user_id, product_id) DO NOTHING",
                userId, productId);
    }

    @Transactional
    public void removeWishlist(long userId, long productId) {
        jdbc.update("DELETE FROM wishlist_items WHERE user_id = ? AND product_id = ?", userId, productId);
    }

    @Transactional
    public void clearWishlist(long userId) {
        jdbc.update("DELETE FROM wishlist_items WHERE user_id = ?", userId);
    }

    @Transactional(readOnly = true)
    public List<ShoppingItemResponse> getCompare(long userId) {
        return jdbc.query("SELECT ci.id AS item_id, ci.product_id, " + PRODUCT_COLUMNS +
                        PRODUCT_JOINS + " JOIN compare_items ci ON ci.product_id = p.id " +
                        "WHERE ci.user_id = ? AND p.status = 'ACTIVE' ORDER BY ci.position, ci.id",
                itemMapper(false), userId);
    }

    @Transactional
    public void addCompare(long userId, long productId) {
        requireActiveProduct(productId);
        Integer exists = jdbc.queryForObject("SELECT COUNT(*) FROM compare_items WHERE user_id = ? AND product_id = ?",
                Integer.class, userId, productId);
        if (exists != null && exists > 0) return;

        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM compare_items WHERE user_id = ?", Integer.class, userId);
        if (count != null && count >= MAX_COMPARE_ITEMS) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bạn chỉ có thể so sánh tối đa 4 thiết bị.");
        }
        int nextPosition = jdbc.queryForObject("SELECT COALESCE(MAX(position), -1) + 1 FROM compare_items WHERE user_id = ?",
                Integer.class, userId);
        jdbc.update("INSERT INTO compare_items (user_id, product_id, position) VALUES (?, ?, ?)",
                userId, productId, nextPosition);
    }

    @Transactional
    public void removeCompare(long userId, long productId) {
        jdbc.update("DELETE FROM compare_items WHERE user_id = ? AND product_id = ?", userId, productId);
        normalizeComparePositions(userId);
    }

    @Transactional
    public void clearCompare(long userId) {
        jdbc.update("DELETE FROM compare_items WHERE user_id = ?", userId);
    }

    @Transactional
    public CartResponse getCart(long userId) {
        long cartId = ensureCart(userId);
        releaseExpiredCartItems(cartId);
        List<ShoppingItemResponse> items = queryCartItems(cartId);
        return calculateCart(items);
    }

    @Transactional
    public CartResponse addCartItem(long userId, ItemRequest request) {
        long cartId = ensureCart(userId);
        releaseExpiredCartItems(cartId);
        ProductRow product = lockActiveProductAvailability(request.productId(), cartId);
        int quantity = request.quantity() == null ? 1 : request.quantity();
        validateQuantity(quantity, product.availableQuantity());
        validateDatePair(request.startDate(), request.endDate());

        List<Long> existingIds = jdbc.query("SELECT id FROM cart_items WHERE cart_id = ? AND product_id = ?",
                (rs, row) -> rs.getLong(1), cartId, request.productId());
        if (existingIds.isEmpty()) {
            jdbc.update("""
                    INSERT INTO cart_items (cart_id, product_id, quantity, start_date, end_date, reserved_until)
                    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP + INTERVAL '10 minutes')
                    """,
                    cartId, request.productId(), quantity, request.startDate(), request.endDate());
        } else {
            int oldQuantity = jdbc.queryForObject("SELECT quantity FROM cart_items WHERE id = ?", Integer.class, existingIds.get(0));
            validateQuantity(oldQuantity + quantity, product.availableQuantity());
            jdbc.update("""
                    UPDATE cart_items SET quantity = ?, start_date = ?, end_date = ?,
                        reserved_until = CURRENT_TIMESTAMP + INTERVAL '10 minutes'
                    WHERE id = ? AND cart_id = ?
                    """,
                    oldQuantity + quantity, request.startDate(), request.endDate(), existingIds.get(0), cartId);
        }
        return calculateCart(queryCartItems(cartId));
    }

    @Transactional
    public CartResponse updateCartItem(long userId, long itemId, CartUpdateRequest request) {
        long cartId = ensureCart(userId);
        releaseExpiredCartItems(cartId);
        CartItemRow item = findCartItem(cartId, itemId);
        ProductRow product = lockActiveProductAvailability(item.productId(), cartId);
        int quantity = request.quantity() == null ? item.quantity() : request.quantity();
        LocalDate startDate = request.startDate() == null ? item.startDate() : request.startDate();
        LocalDate endDate = request.endDate() == null ? item.endDate() : request.endDate();
        validateQuantity(quantity, product.availableQuantity());
        validateDatePair(startDate, endDate);
        jdbc.update("""
                UPDATE cart_items SET quantity = ?, start_date = ?, end_date = ?,
                    reserved_until = CURRENT_TIMESTAMP + INTERVAL '10 minutes'
                WHERE id = ? AND cart_id = ?
                """,
                quantity, startDate, endDate, itemId, cartId);
        return calculateCart(queryCartItems(cartId));
    }

    @Transactional
    public CartResponse removeCartItem(long userId, long itemId) {
        long cartId = ensureCart(userId);
        jdbc.update("DELETE FROM cart_items WHERE id = ? AND cart_id = ?", itemId, cartId);
        return calculateCart(queryCartItems(cartId));
    }

    @Transactional
    public CartResponse clearCart(long userId) {
        long cartId = ensureCart(userId);
        jdbc.update("DELETE FROM cart_items WHERE cart_id = ?", cartId);
        return calculateCart(List.of());
    }

    @Transactional
    public CheckoutResponse checkout(long userId, CheckoutRequest request) {
        long cartId = ensureCart(userId);
        Integer expiredItems = jdbc.queryForObject("""
                SELECT COUNT(*) FROM cart_items
                WHERE cart_id = ? AND reserved_until <= CURRENT_TIMESTAMP
                """, Integer.class, cartId);
        if (expiredItems != null && expiredItems > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Thời gian giữ chỗ đã hết. Vui lòng quay lại giỏ hàng để chọn lại thiết bị.");
        }
        List<ShoppingItemResponse> items = queryCartItems(cartId);
        if (items.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Giỏ hàng đang trống.");

        String deliveryMethod = request.deliveryMethod().trim().toUpperCase();
        String paymentMethod = "MANUAL";
        if (!List.of("HOME", "STORE").contains(deliveryMethod)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phương thức nhận thiết bị không hợp lệ.");
        }
        if ("HOME".equals(deliveryMethod) && (request.deliveryAddress() == null || request.deliveryAddress().isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng nhập địa chỉ giao hàng.");
        }

        BigDecimal rentalTotal = BigDecimal.ZERO;
        BigDecimal depositTotal = BigDecimal.ZERO;
        for (ShoppingItemResponse item : items) {
            if (item.startDate() == null || item.endDate() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng chọn thời gian thuê cho tất cả thiết bị.");
            }
            validateDatePair(item.startDate(), item.endDate());
            long days = ChronoUnit.DAYS.between(item.startDate(), item.endDate());
            rentalTotal = rentalTotal.add(item.price().multiply(BigDecimal.valueOf(days)).multiply(BigDecimal.valueOf(item.quantity())));
            depositTotal = depositTotal.add(item.depositAmount().multiply(BigDecimal.valueOf(item.quantity())));
        }
        for (ShoppingItemResponse item : items.stream()
                .sorted(Comparator.comparing(ShoppingItemResponse::productId)).toList()) {
            ProductRow product = lockActiveProductAvailability(item.productId(), cartId);
            if (item.quantity() > product.availableQuantity()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Số lượng thiết bị còn lại đã thay đổi. Vui lòng cập nhật giỏ hàng.");
            }
            int reserved = jdbc.update("""
                    UPDATE products SET stock = COALESCE(stock, 0) - ?
                    WHERE id = ? AND status = 'ACTIVE' AND COALESCE(stock, 0) >= ?
                    """, item.quantity(), item.productId(), item.quantity());
            if (reserved != 1) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Thiết bị vừa hết số lượng có thể thuê. Vui lòng cập nhật giỏ hàng.");
            }
        }
        BigDecimal serviceFee = rentalTotal.multiply(SERVICE_FEE_RATE).setScale(0, RoundingMode.HALF_UP);
        BigDecimal total = rentalTotal.add(depositTotal).add(serviceFee);
        String rentalCode = "LR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Long rentalId = jdbc.queryForObject("""
                INSERT INTO rentals (
                    rental_code, renter_id, total_amount, deposit_amount, service_fee, status,
                    delivery_method, delivery_address, district, city, contact_name, contact_phone, contact_email
                ) VALUES (?, ?, ?, ?, ?, 'PENDING', ?, ?, ?, ?, ?, ?, ?) RETURNING id
                """, Long.class, rentalCode, userId, total, depositTotal, serviceFee,
                deliveryMethod, request.deliveryAddress(), request.district(), request.city(),
                request.contactName().trim(), request.contactPhone().trim(), request.contactEmail());

        for (ShoppingItemResponse item : items) {
            long days = ChronoUnit.DAYS.between(item.startDate(), item.endDate());
            BigDecimal subtotal = item.price().multiply(BigDecimal.valueOf(days)).multiply(BigDecimal.valueOf(item.quantity()));
            jdbc.update("""
                    INSERT INTO rental_items (rental_id, product_id, quantity, start_date, end_date, daily_price, subtotal)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, rentalId, item.productId(), item.quantity(), item.startDate(), item.endDate(), item.price(), subtotal);
        }
        jdbc.update("""
                INSERT INTO payments (rental_id, method, provider, amount, status, paid_at)
                VALUES (?, ?, ?, ?, 'PAID', CURRENT_TIMESTAMP)
                """, rentalId, paymentMethod, paymentMethod, total);
        jdbc.update("DELETE FROM cart_items WHERE cart_id = ?", cartId);
        return new CheckoutResponse(rentalId, rentalCode, total, rentalTotal, depositTotal, serviceFee,
                "PENDING", "PAID", paymentMethod, LocalDateTime.now());
    }

    @Transactional(readOnly = true)
    public RenterDashboard getRenterDashboard(long userId) {
        String fullName = jdbc.queryForObject("SELECT COALESCE(full_name, 'Khách thuê LensRent') FROM users WHERE id = ?",
                String.class, userId);
        Integer rentingDevices = jdbc.queryForObject("""
                SELECT COALESCE(SUM(ri.quantity), 0)::integer
                FROM rentals r JOIN rental_items ri ON ri.rental_id = r.id
                WHERE r.renter_id = ? AND UPPER(COALESCE(ri.status, r.status, '')) IN ('CONFIRMED', 'ACTIVE', 'IN_PROGRESS', 'RENTING')
                """, Integer.class, userId);
        Integer pendingReturns = jdbc.queryForObject("""
                SELECT COUNT(*)::integer FROM rentals
                WHERE renter_id = ? AND UPPER(COALESCE(status, '')) IN ('RETURN_PENDING', 'RETURN_REQUESTED', 'AWAITING_RETURN')
                """, Integer.class, userId);
        BigDecimal totalDeposit = jdbc.queryForObject("""
                SELECT COALESCE(SUM(deposit_amount), 0) FROM rentals
                WHERE renter_id = ? AND UPPER(COALESCE(status, '')) NOT IN ('COMPLETED', 'CANCELLED', 'CANCELED', 'REJECTED')
                """, BigDecimal.class, userId);
        List<RentalSummary> history = queryRentalSummaries(userId, 20);
        return new RenterDashboard(fullName, rentingDevices == null ? 0 : rentingDevices,
                pendingReturns == null ? 0 : pendingReturns, zero(totalDeposit), 980,
                history.stream().limit(3).toList(), history);
    }

    @Transactional(readOnly = true)
    public List<RentalSummary> getRentals(long userId) {
        return queryRentalSummaries(userId, 100);
    }

    @Transactional(readOnly = true)
    public List<CurrentRentalItem> getCurrentRentalItems(long userId) {
        return jdbc.query("""
                SELECT r.id AS rental_id, r.rental_code, ri.status AS rental_status,
                       p.id AS product_id, p.name, COALESCE(image.image_url, '') AS image_key,
                       ri.quantity, ri.start_date, ri.end_date, ri.daily_price, ri.subtotal
                FROM rentals r
                JOIN rental_items ri ON ri.rental_id = r.id
                JOIN products p ON p.id = ri.product_id
                LEFT JOIN LATERAL (
                    SELECT image_url FROM product_images WHERE product_id = p.id
                    ORDER BY is_primary DESC NULLS LAST, id LIMIT 1
                ) image ON TRUE
                WHERE r.renter_id = ?
                  AND UPPER(COALESCE(ri.status, r.status, '')) IN ('CONFIRMED', 'ACTIVE', 'IN_PROGRESS', 'RENTING')
                ORDER BY ri.start_date, r.created_at DESC, ri.id
                """, (rs, rowNum) -> new CurrentRentalItem(
                rs.getLong("rental_id"), rs.getString("rental_code"), rs.getString("rental_status"),
                rs.getLong("product_id"), rs.getString("name"), rs.getString("image_key"),
                rs.getInt("quantity"), rs.getDate("start_date").toLocalDate(), rs.getDate("end_date").toLocalDate(),
                zero(rs.getBigDecimal("daily_price")), zero(rs.getBigDecimal("subtotal"))
        ), userId);
    }

    @Transactional(readOnly = true)
    public RentalDetail getRental(long userId, long rentalId) {
        List<RentalDetail> rentals = jdbc.query("""
                SELECT r.id, r.rental_code, r.status, r.total_amount,
                       GREATEST(r.total_amount - r.deposit_amount - r.service_fee, 0) AS rental_amount,
                       r.deposit_amount, r.service_fee, r.delivery_method, r.delivery_address,
                       r.district, r.city, r.contact_name, r.contact_phone, r.contact_email,
                       payment.method AS payment_method, payment.status AS payment_status, r.created_at
                FROM rentals r
                LEFT JOIN LATERAL (
                    SELECT method, status FROM payments WHERE rental_id = r.id ORDER BY id DESC LIMIT 1
                ) payment ON TRUE
                WHERE r.id = ? AND r.renter_id = ?
                """, (rs, rowNum) -> new RentalDetail(
                rs.getLong("id"), rs.getString("rental_code"), rs.getString("status"),
                zero(rs.getBigDecimal("total_amount")), zero(rs.getBigDecimal("rental_amount")),
                zero(rs.getBigDecimal("deposit_amount")), zero(rs.getBigDecimal("service_fee")),
                rs.getString("delivery_method"), rs.getString("delivery_address"), rs.getString("district"),
                rs.getString("city"), rs.getString("contact_name"), rs.getString("contact_phone"),
                rs.getString("contact_email"), rs.getString("payment_method"), rs.getString("payment_status"),
                rs.getTimestamp("created_at") == null ? null : rs.getTimestamp("created_at").toLocalDateTime(),
                List.of()
        ), rentalId, userId);
        if (rentals.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn thuê.");
        RentalDetail rental = rentals.get(0);
        return new RentalDetail(rental.rentalId(), rental.rentalCode(), rental.status(), rental.totalAmount(),
                rental.rentalAmount(), rental.depositAmount(), rental.serviceFee(), rental.deliveryMethod(),
                rental.deliveryAddress(), rental.district(), rental.city(), rental.contactName(), rental.contactPhone(),
                rental.contactEmail(), rental.paymentMethod(), rental.paymentStatus(), rental.createdAt(),
                queryRentalItems(rental.rentalId()));
    }

    private List<RentalSummary> queryRentalSummaries(long userId, int limit) {
        return jdbc.query("""
                SELECT r.id AS rental_id, r.rental_code, r.status, r.total_amount, r.deposit_amount, r.created_at,
                       COALESCE(item_count.item_count, 0)::integer AS item_count,
                       first_item.name AS first_product_name, first_item.image_key AS first_image_key
                FROM rentals r
                LEFT JOIN LATERAL (
                    SELECT COUNT(*) AS item_count FROM rental_items WHERE rental_id = r.id
                ) item_count ON TRUE
                LEFT JOIN LATERAL (
                    SELECT p.name, COALESCE(pi.image_url, '') AS image_key
                    FROM rental_items ri JOIN products p ON p.id = ri.product_id
                    LEFT JOIN LATERAL (
                        SELECT image_url FROM product_images WHERE product_id = p.id
                        ORDER BY is_primary DESC NULLS LAST, id LIMIT 1
                    ) pi ON TRUE
                    WHERE ri.rental_id = r.id ORDER BY ri.id LIMIT 1
                ) first_item ON TRUE
                WHERE r.renter_id = ? ORDER BY r.created_at DESC, r.id DESC LIMIT ?
                """, (rs, rowNum) -> new RentalSummary(
                rs.getLong("rental_id"), rs.getString("rental_code"), rs.getString("status"),
                zero(rs.getBigDecimal("total_amount")), zero(rs.getBigDecimal("deposit_amount")),
                rs.getTimestamp("created_at") == null ? null : rs.getTimestamp("created_at").toLocalDateTime(),
                rs.getInt("item_count"), rs.getString("first_product_name"), rs.getString("first_image_key")
        ), userId, limit);
    }

    private List<RentalItemDetail> queryRentalItems(long rentalId) {
        return jdbc.query("""
                SELECT ri.product_id, p.name, COALESCE(image.image_url, '') AS image_key,
                       ri.quantity, ri.start_date, ri.end_date, ri.daily_price, ri.subtotal
                FROM rental_items ri JOIN products p ON p.id = ri.product_id
                LEFT JOIN LATERAL (
                    SELECT image_url FROM product_images WHERE product_id = p.id
                    ORDER BY is_primary DESC NULLS LAST, id LIMIT 1
                ) image ON TRUE
                WHERE ri.rental_id = ? ORDER BY ri.id
                """, (rs, rowNum) -> new RentalItemDetail(
                rs.getLong("product_id"), rs.getString("name"), rs.getString("image_key"), rs.getInt("quantity"),
                rs.getObject("start_date", LocalDate.class), rs.getObject("end_date", LocalDate.class),
                zero(rs.getBigDecimal("daily_price")), zero(rs.getBigDecimal("subtotal"))
        ), rentalId);
    }

    private CartResponse calculateCart(List<ShoppingItemResponse> items) {
        BigDecimal rentalTotal = BigDecimal.ZERO;
        BigDecimal depositTotal = BigDecimal.ZERO;
        for (ShoppingItemResponse item : items) {
            if (item.startDate() != null && item.endDate() != null && item.endDate().isAfter(item.startDate())) {
                long days = ChronoUnit.DAYS.between(item.startDate(), item.endDate());
                rentalTotal = rentalTotal.add(item.price().multiply(BigDecimal.valueOf(days)).multiply(BigDecimal.valueOf(item.quantity())));
            }
            depositTotal = depositTotal.add(item.depositAmount().multiply(BigDecimal.valueOf(item.quantity())));
        }
        BigDecimal serviceFee = rentalTotal.multiply(SERVICE_FEE_RATE).setScale(0, RoundingMode.HALF_UP);
        return new CartResponse(items, rentalTotal, depositTotal, serviceFee,
                rentalTotal.add(depositTotal).add(serviceFee));
    }

    private List<ShoppingItemResponse> queryCartItems(long cartId) {
        String cartProductColumns = PRODUCT_COLUMNS.replace(
                "COALESCE(p.stock, 0) AS available_quantity",
                "GREATEST(COALESCE(p.stock, 0) - COALESCE((SELECT SUM(held.quantity) " +
                        "FROM cart_items held JOIN carts held_cart ON held_cart.id = held.cart_id " +
                        "WHERE held.product_id = p.id AND held_cart.id <> ci.cart_id " +
                        "AND held.reserved_until > CURRENT_TIMESTAMP), 0), 0) AS available_quantity");
        return jdbc.query("SELECT ci.id AS item_id, ci.product_id, ci.quantity, ci.start_date, ci.end_date, " + cartProductColumns +
                        PRODUCT_JOINS + " JOIN cart_items ci ON ci.product_id = p.id " +
                        "WHERE ci.cart_id = ? AND ci.reserved_until > CURRENT_TIMESTAMP AND p.status = 'ACTIVE' ORDER BY ci.id",
                itemMapper(true), cartId);
    }

    private RowMapper<ShoppingItemResponse> itemMapper(boolean cart) {
        return (rs, rowNum) -> mapItem(rs, cart);
    }

    private ShoppingItemResponse mapItem(ResultSet rs, boolean cart) throws SQLException {
        String tags = rs.getString("tags");
        List<String> parsedTags = tags == null || tags.isBlank() ? List.of() : Arrays.stream(tags.split("\\|"))
                .map(String::trim).filter(tag -> !tag.isEmpty()).toList();
        return new ShoppingItemResponse(
                rs.getLong("item_id"), rs.getLong("product_id"), rs.getString("name"), rs.getString("type"),
                rs.getString("category"), rs.getString("category_name"), rs.getString("brand"), rs.getBigDecimal("rating"),
                parsedTags, zero(rs.getBigDecimal("price")), zero(rs.getBigDecimal("deposit_amount")),
                rs.getString("image_key"), rs.getInt("available_quantity"), rs.getString("product_status"),
                cart ? rs.getInt("quantity") : null,
                cart ? rs.getObject("start_date", LocalDate.class) : null,
                cart ? rs.getObject("end_date", LocalDate.class) : null
        );
    }

    private long ensureCart(long userId) {
        return jdbc.queryForObject("""
                INSERT INTO carts (user_id, updated_at) VALUES (?, CURRENT_TIMESTAMP)
                ON CONFLICT (user_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
                RETURNING id
                """, Long.class, userId);
    }

    private ProductRow requireActiveProduct(long productId) {
        List<ProductRow> products = jdbc.query("SELECT COALESCE(stock, 0) AS available_quantity FROM products WHERE id = ? AND status = 'ACTIVE'",
                (rs, rowNum) -> new ProductRow(rs.getInt("available_quantity")), productId);
        if (products.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy thiết bị đang hoạt động.");
        return products.get(0);
    }

    private ProductRow lockActiveProductAvailability(long productId, long cartId) {
        List<Integer> lockedProducts = jdbc.query("""
                SELECT id FROM products WHERE id = ? AND status = 'ACTIVE' FOR UPDATE
                """, (rs, rowNum) -> rs.getInt(1), productId);
        if (lockedProducts.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy thiết bị đang hoạt động.");
        }
        Integer available = jdbc.queryForObject("""
                SELECT GREATEST(COALESCE(p.stock, 0) - COALESCE((
                    SELECT SUM(held.quantity)
                    FROM cart_items held
                    JOIN carts held_cart ON held_cart.id = held.cart_id
                    WHERE held.product_id = p.id
                      AND held_cart.id <> ?
                      AND held.reserved_until > CURRENT_TIMESTAMP
                ), 0), 0)::integer
                FROM products p WHERE p.id = ?
                """, Integer.class, cartId, productId);
        return new ProductRow(available == null ? 0 : available);
    }

    private void releaseExpiredCartItems(long cartId) {
        jdbc.update("DELETE FROM cart_items WHERE cart_id = ? AND reserved_until <= CURRENT_TIMESTAMP", cartId);
    }

    private CartItemRow findCartItem(long cartId, long itemId) {
        List<CartItemRow> items = jdbc.query("SELECT product_id, quantity, start_date, end_date FROM cart_items WHERE cart_id = ? AND id = ?",
                (rs, rowNum) -> new CartItemRow(rs.getLong("product_id"), rs.getInt("quantity"),
                        rs.getObject("start_date", LocalDate.class), rs.getObject("end_date", LocalDate.class)), cartId, itemId);
        if (items.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy thiết bị trong giỏ hàng.");
        return items.get(0);
    }

    private void normalizeComparePositions(long userId) {
        List<Long> ids = jdbc.query("SELECT id FROM compare_items WHERE user_id = ? ORDER BY position, id",
                (rs, rowNum) -> rs.getLong(1), userId);
        for (int i = 0; i < ids.size(); i++) {
            jdbc.update("UPDATE compare_items SET position = ? WHERE id = ?", i, ids.get(i));
        }
    }

    private void validateQuantity(int quantity, int availableQuantity) {
        if (quantity < 1) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số lượng phải từ 1 trở lên.");
        if (availableQuantity < 1) throw new ResponseStatusException(HttpStatus.CONFLICT, "Thiết bị hiện đã được thuê hết.");
        if (quantity > availableQuantity) throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Chỉ còn " + availableQuantity + " thiết bị có thể thuê.");
    }

    private void validateDatePair(LocalDate startDate, LocalDate endDate) {
        if ((startDate == null) != (endDate == null)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cần chọn cả ngày bắt đầu và ngày kết thúc.");
        }
        if (startDate != null && !endDate.isAfter(startDate)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ngày kết thúc phải sau ngày bắt đầu.");
        }
    }

    private BigDecimal zero(BigDecimal value) { return value == null ? BigDecimal.ZERO : value; }

    private record ProductRow(int availableQuantity) {}
    private record CartItemRow(long productId, int quantity, LocalDate startDate, LocalDate endDate) {}
}
