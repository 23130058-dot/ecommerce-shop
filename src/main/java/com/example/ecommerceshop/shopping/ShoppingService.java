package com.example.ecommerceshop.shopping;

import com.example.ecommerceshop.shopping.ShoppingDtos.CartResponse;
import com.example.ecommerceshop.shopping.ShoppingDtos.CheckoutResponse;
import com.example.ecommerceshop.shopping.ShoppingDtos.ItemRequest;
import com.example.ecommerceshop.catalog.ProductAvailabilityService;
import com.example.ecommerceshop.wallet.WalletService;
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
    private static final BigDecimal STUDENT_DISCOUNT_RATE = new BigDecimal("0.15");
    private static final BigDecimal HOME_DELIVERY_FEE = new BigDecimal("50000");
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
    private final ProductAvailabilityService availabilityService;
    private final WalletService walletService;

    public ShoppingService(JdbcTemplate jdbc, ProductAvailabilityService availabilityService, WalletService walletService) {
        this.jdbc = jdbc;
        this.availabilityService = availabilityService;
        this.walletService = walletService;
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
        releaseOwnerCartItems(userId, cartId);
        List<ShoppingItemResponse> items = queryCartItems(cartId);
        return calculateCart(items, userId);
    }

    @Transactional
    public CartResponse addCartItem(long userId, ItemRequest request) {
        long cartId = ensureCart(userId);
        releaseExpiredCartItems(cartId);
        ProductRow product = lockActiveProductAvailability(request.productId(), cartId);
        rejectOwnerRenting(userId, product);
        int quantity = request.quantity() == null ? 1 : request.quantity();
        validateDatePair(request.startDate(), request.endDate());
        if (request.startDate() == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Vui lòng chọn ngày thuê trước khi thêm thiết bị vào giỏ.");

        List<Long> existingIds = jdbc.query("SELECT id FROM cart_items WHERE cart_id = ? AND product_id = ?",
                (rs, row) -> rs.getLong(1), cartId, request.productId());
        int oldQuantity = existingIds.isEmpty() ? 0 : jdbc.queryForObject(
                "SELECT quantity FROM cart_items WHERE id = ?", Integer.class, existingIds.get(0));
        if (!existingIds.isEmpty()) {
            CartItemRow existing = findCartItem(cartId, existingIds.get(0));
            if (!request.startDate().equals(existing.startDate()) || !request.endDate().equals(existing.endDate())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,"Thiết bị này đã có trong giỏ với ngày thuê khác. Hãy sửa ngày trong giỏ hàng.");
            }
        }
        availabilityService.requireAvailable(request.productId(),request.startDate(),request.endDate(),oldQuantity+quantity,cartId);
        if (existingIds.isEmpty()) {
            jdbc.update("""
                    INSERT INTO cart_items (cart_id, product_id, quantity, start_date, end_date, reserved_until)
                    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP + INTERVAL '10 minutes')
                    """,cartId, request.productId(), quantity, request.startDate(), request.endDate());
        } else {
            jdbc.update("""
                    UPDATE cart_items SET quantity = ?, reserved_until = CURRENT_TIMESTAMP + INTERVAL '10 minutes'
                    WHERE id = ? AND cart_id = ?
                    """,oldQuantity + quantity, existingIds.get(0), cartId);
        }
        return calculateCart(queryCartItems(cartId), userId);
    }

    @Transactional
    public CartResponse updateCartItem(long userId, long itemId, CartUpdateRequest request) {
        long cartId = ensureCart(userId);
        releaseExpiredCartItems(cartId);
        CartItemRow item = findCartItem(cartId, itemId);
        ProductRow product = lockActiveProductAvailability(item.productId(), cartId);
        rejectOwnerRenting(userId, product);
        int quantity = request.quantity() == null ? item.quantity() : request.quantity();
        LocalDate startDate = request.startDate() == null ? item.startDate() : request.startDate();
        LocalDate endDate = request.endDate() == null ? item.endDate() : request.endDate();
        validateDatePair(startDate, endDate);
        availabilityService.requireAvailable(item.productId(),startDate,endDate,quantity,cartId);
        jdbc.update("""
                UPDATE cart_items SET quantity = ?, start_date = ?, end_date = ?,
                    reserved_until = CURRENT_TIMESTAMP + INTERVAL '10 minutes'
                WHERE id = ? AND cart_id = ?
                """,
                quantity, startDate, endDate, itemId, cartId);
        return calculateCart(queryCartItems(cartId), userId);
    }

    @Transactional
    public CartResponse removeCartItem(long userId, long itemId) {
        long cartId = ensureCart(userId);
        jdbc.update("DELETE FROM cart_items WHERE id = ? AND cart_id = ?", itemId, cartId);
        return calculateCart(queryCartItems(cartId), userId);
    }

    @Transactional
    public CartResponse clearCart(long userId) {
        long cartId = ensureCart(userId);
        jdbc.update("DELETE FROM cart_items WHERE cart_id = ?", cartId);
        return calculateCart(List.of(), userId);
    }

    @Transactional
    public CheckoutResponse checkout(long userId, CheckoutRequest request) {
        requireVerifiedIdentity(userId, "đặt thuê thiết bị");
        long cartId = ensureCart(userId);
        releaseOwnerCartItems(userId, cartId);
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
        String paymentMethod = request.paymentMethod() == null ? "MANUAL" : request.paymentMethod().trim().toUpperCase();
        if (!List.of("HOME", "STORE").contains(deliveryMethod)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phương thức nhận thiết bị không hợp lệ.");
        }
        if ("HOME".equals(deliveryMethod) && (request.deliveryAddress() == null || request.deliveryAddress().isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng nhập địa chỉ giao hàng.");
        }

        boolean studentDiscountEligible = hasApprovedStudentCard(userId);
        BigDecimal rentalSubtotal = BigDecimal.ZERO;
        BigDecimal rentalTotal = BigDecimal.ZERO;
        BigDecimal studentDiscountAmount = BigDecimal.ZERO;
        BigDecimal depositTotal = BigDecimal.ZERO;
        java.util.Map<Long, BigDecimal> itemSubtotals = new java.util.HashMap<>();
        for (ShoppingItemResponse item : items) {
            if (item.startDate() == null || item.endDate() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng chọn thời gian thuê cho tất cả thiết bị.");
            }
            validateDatePair(item.startDate(), item.endDate());
            validateSchedule(item);
            BigDecimal baseSubtotal = calculateScheduledSubtotal(item);
            BigDecimal itemDiscount = studentDiscountEligible ? calculateStudentDiscount(baseSubtotal) : BigDecimal.ZERO;
            BigDecimal subtotal = baseSubtotal.subtract(itemDiscount);
            itemSubtotals.put(item.productId(),subtotal);
            rentalSubtotal = rentalSubtotal.add(baseSubtotal);
            studentDiscountAmount = studentDiscountAmount.add(itemDiscount);
            rentalTotal = rentalTotal.add(subtotal);
            depositTotal = depositTotal.add(item.depositAmount().multiply(BigDecimal.valueOf(item.quantity())));
        }
        for (ShoppingItemResponse item : items.stream()
                .sorted(Comparator.comparing(ShoppingItemResponse::productId)).toList()) {
            ProductRow product = lockActiveProductAvailability(item.productId(), cartId);
            rejectOwnerRenting(userId, product);
            availabilityService.requireAvailable(item.productId(),item.startDate(),item.endDate(),item.quantity(),cartId);
            int reserved = jdbc.update("""
                    UPDATE products SET stock = COALESCE(stock, 0) - ?
                    WHERE id = ? AND status = 'ACTIVE' AND COALESCE(stock, 0) >= ?
                    """, item.quantity(), item.productId(), item.quantity());
            if (reserved != 1) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Thiết bị vừa hết số lượng có thể thuê. Vui lòng cập nhật giỏ hàng.");
            }
        }
        BigDecimal serviceFee = rentalTotal.multiply(SERVICE_FEE_RATE).setScale(0, RoundingMode.HALF_UP);
        BigDecimal deliveryFee = "HOME".equals(deliveryMethod) ? HOME_DELIVERY_FEE : BigDecimal.ZERO;
        BigDecimal total = rentalTotal.add(depositTotal).add(serviceFee).add(deliveryFee);
        String rentalCode = "LR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Long rentalId = jdbc.queryForObject("""
                INSERT INTO rentals (
                    rental_code, renter_id, total_amount, deposit_amount, service_fee,
                    student_discount_amount, delivery_fee, status,
                    delivery_method, delivery_address, district, city, contact_name, contact_phone, contact_email
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?, ?, ?, ?, ?) RETURNING id
                """, Long.class, rentalCode, userId, total, depositTotal, serviceFee,
                studentDiscountAmount, deliveryFee,
                deliveryMethod, request.deliveryAddress(), request.district(), request.city(),
                request.contactName().trim(), request.contactPhone().trim(), request.contactEmail());

        for (ShoppingItemResponse item : items) {
            BigDecimal subtotal = itemSubtotals.get(item.productId());
            jdbc.update("""
                    INSERT INTO rental_items (rental_id, product_id, quantity, start_date, end_date, daily_price, subtotal)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, rentalId, item.productId(), item.quantity(), item.startDate(), item.endDate(), item.price(), subtotal);
        }
        if ("WALLET".equals(paymentMethod)) {
            walletService.chargeRental(userId, rentalId, rentalTotal.add(serviceFee).add(deliveryFee), depositTotal);
        }
        jdbc.update("""
                INSERT INTO payments (rental_id, method, provider, amount, status, paid_at)
                VALUES (?, ?, ?, ?, 'PAID', CURRENT_TIMESTAMP)
                """, rentalId, paymentMethod, paymentMethod, total);
        jdbc.update("""
                INSERT INTO user_notifications(user_id,type,title,message,target_url)
                SELECT DISTINCT p.owner_id,'BOOKING','Có đơn thuê mới',
                       'Bạn vừa nhận được yêu cầu thuê '||p.name||' ('||?||').','/owner/bookings'
                FROM rental_items ri JOIN products p ON p.id=ri.product_id WHERE ri.rental_id=?
                """,rentalCode,rentalId);
        jdbc.update("DELETE FROM cart_items WHERE cart_id = ?", cartId);
        return new CheckoutResponse(rentalId, rentalCode, total, rentalTotal, depositTotal, serviceFee,
                "PENDING", "PAID", paymentMethod, LocalDateTime.now(), rentalSubtotal,
                studentDiscountAmount, deliveryFee);
    }

    @Transactional(readOnly = true)
    public RenterDashboard getRenterDashboard(long userId) {
        String fullName = jdbc.queryForObject("SELECT COALESCE(full_name, 'Khách thuê LensRent') FROM users WHERE id = ?",
                String.class, userId);
        Integer rentingDevices = jdbc.queryForObject("""
                SELECT COALESCE(SUM(ri.quantity), 0)::integer
                FROM rentals r JOIN rental_items ri ON ri.rental_id = r.id
                WHERE r.renter_id = ? AND UPPER(COALESCE(ri.status, r.status, '')) IN ('ACTIVE', 'IN_PROGRESS', 'RENTING')
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
    public List<RenterNotificationResponse> getRenterNotifications(long userId) {
        return jdbc.query("""
                SELECT n.id,n.type,n.title,n.message,n.target_url,n.created_at,n.read_at
                FROM user_notifications n
                LEFT JOIN user_notification_preferences prefs ON prefs.user_id=n.user_id
                WHERE n.user_id=? AND COALESCE(prefs.in_app_enabled,TRUE)
                  AND CASE
                    WHEN UPPER(n.type) = 'RETURN' THEN COALESCE(prefs.return_reminders,TRUE)
                    WHEN UPPER(n.type) IN ('BOOKING','ORDER','DAMAGE') THEN COALESCE(prefs.order_updates,TRUE)
                    WHEN UPPER(n.type) IN ('PAYMENT','WALLET','DEPOSIT') THEN COALESCE(prefs.payment_updates,TRUE)
                    WHEN UPPER(n.type) IN ('DISPUTE','REPORT') THEN COALESCE(prefs.disputes,TRUE)
                    WHEN UPPER(n.type) IN ('PRODUCT_IDEA','RECOMMENDATION') THEN COALESCE(prefs.product_recommendations,FALSE)
                    WHEN UPPER(n.type) IN ('PROMOTION','COUPON') THEN COALESCE(prefs.promotions,FALSE)
                    ELSE TRUE
                  END
                  AND NOT (COALESCE(prefs.quiet_hours_enabled,FALSE)
                    AND UPPER(n.type) IN ('PRODUCT_IDEA','RECOMMENDATION','PROMOTION','COUPON')
                    AND ((prefs.quiet_start < prefs.quiet_end AND
                          (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::time >= prefs.quiet_start AND
                          (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::time < prefs.quiet_end)
                      OR (prefs.quiet_start >= prefs.quiet_end AND
                          ((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::time >= prefs.quiet_start OR
                           (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::time < prefs.quiet_end))))
                ORDER BY n.id DESC LIMIT 100
                """,
                (rs,n)->new RenterNotificationResponse(rs.getLong("id"),rs.getString("type"),rs.getString("title"),
                        rs.getString("message"),rs.getString("target_url"),
                        rs.getTimestamp("created_at")==null?null:rs.getTimestamp("created_at").toLocalDateTime(),
                        rs.getTimestamp("read_at")==null?null:rs.getTimestamp("read_at").toLocalDateTime()),userId);
    }

    @Transactional
    public void markRenterNotificationsRead(long userId) {
        jdbc.update("UPDATE user_notifications SET read_at=CURRENT_TIMESTAMP WHERE user_id=? AND read_at IS NULL",userId);
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
                  AND UPPER(COALESCE(ri.status, r.status, '')) IN ('ACTIVE', 'IN_PROGRESS', 'RENTING')
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
                       COALESCE((SELECT SUM(ri.subtotal) FROM rental_items ri WHERE ri.rental_id = r.id),
                                GREATEST(r.total_amount - r.deposit_amount - r.service_fee - r.delivery_fee, 0)) AS rental_amount,
                       r.deposit_amount, r.service_fee, r.student_discount_amount, r.delivery_fee,
                       r.delivery_method, r.delivery_address,
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
                zero(rs.getBigDecimal("student_discount_amount")), zero(rs.getBigDecimal("delivery_fee")),
                rs.getString("delivery_method"), rs.getString("delivery_address"), rs.getString("district"),
                rs.getString("city"), rs.getString("contact_name"), rs.getString("contact_phone"),
                rs.getString("contact_email"), rs.getString("payment_method"), rs.getString("payment_status"),
                rs.getTimestamp("created_at") == null ? null : rs.getTimestamp("created_at").toLocalDateTime(),
                List.of()
        ), rentalId, userId);
        if (rentals.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn thuê.");
        RentalDetail rental = rentals.get(0);
        return new RentalDetail(rental.rentalId(), rental.rentalCode(), rental.status(), rental.totalAmount(),
                rental.rentalAmount(), rental.depositAmount(), rental.serviceFee(), rental.studentDiscountAmount(),
                rental.deliveryFee(), rental.deliveryMethod(),
                rental.deliveryAddress(), rental.district(), rental.city(), rental.contactName(), rental.contactPhone(),
                rental.contactEmail(), rental.paymentMethod(), rental.paymentStatus(), rental.createdAt(),
                queryRentalItems(rental.rentalId()));
    }

    @Transactional
    public void cancelRental(long userId,long rentalId) {
        List<String> statuses=jdbc.query("SELECT status FROM rentals WHERE id=? AND renter_id=? FOR UPDATE",
                (rs,n)->rs.getString(1),rentalId,userId);
        if(statuses.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Không tìm thấy đơn thuê.");
        List<Long> invalid=jdbc.query("""
                SELECT id FROM rental_items WHERE rental_id=? AND
                    (UPPER(COALESCE(status,'')) NOT IN ('PENDING','CONFIRMED') OR start_date<=CURRENT_DATE)
                FOR UPDATE
                """,(rs,n)->rs.getLong(1),rentalId);
        if(!invalid.isEmpty()) throw new ResponseStatusException(HttpStatus.CONFLICT,"Chỉ có thể hủy đơn trước ngày thuê khi tất cả thiết bị còn chờ hoặc đã xác nhận.");
        List<Long> itemIds=jdbc.query("SELECT id FROM rental_items WHERE rental_id=? FOR UPDATE",(rs,n)->rs.getLong(1),rentalId);
        if(itemIds.isEmpty()) throw new ResponseStatusException(HttpStatus.CONFLICT,"Đơn thuê không có thiết bị để hủy.");
        for(Long itemId:itemIds) {
            jdbc.update("UPDATE products p SET stock=COALESCE(stock,0)+ri.quantity FROM rental_items ri WHERE ri.id=? AND p.id=ri.product_id",itemId);
            jdbc.update("UPDATE rental_items SET status='CANCELLED' WHERE id=?",itemId);
        }
        jdbc.update("UPDATE rentals SET status='CANCELLED' WHERE id=?",rentalId);
        walletService.refundCancelledRental(rentalId);
        jdbc.update("UPDATE payments SET status='REFUNDED' WHERE rental_id=? AND status IN ('PAID','SUCCESS','COMPLETED')",rentalId);
        jdbc.update("INSERT INTO user_notifications(user_id,type,title,message,target_url) SELECT DISTINCT p.owner_id,'ORDER','Renter đã hủy đơn','Đơn thuê '||r.rental_code||' đã được hủy.','/owner/bookings' FROM rentals r JOIN rental_items ri ON ri.rental_id=r.id JOIN products p ON p.id=ri.product_id WHERE r.id=?",rentalId);
    }

    @Transactional
    public void requestReturn(long userId,long rentalId) {
        List<Long> items=jdbc.query("""
                SELECT ri.id FROM rental_items ri JOIN rentals r ON r.id=ri.rental_id
                WHERE r.id=? AND r.renter_id=? AND UPPER(COALESCE(ri.status,'')) IN ('ACTIVE','IN_PROGRESS','RENTING')
                  AND ri.start_date<=CURRENT_DATE
                FOR UPDATE
                """,(rs,n)->rs.getLong(1),rentalId,userId);
        if(items.isEmpty()) throw new ResponseStatusException(HttpStatus.CONFLICT,"Chưa thể gửi yêu cầu trả. Thiết bị cần đến ngày bắt đầu thuê và đang ở trạng thái Đang thuê.");
        for(Long itemId:items) jdbc.update("UPDATE rental_items SET status='RETURN_PENDING' WHERE id=?",itemId);
        jdbc.update("INSERT INTO user_notifications(user_id,type,title,message,target_url) SELECT DISTINCT p.owner_id,'RETURN','Có yêu cầu trả thiết bị','Người thuê yêu cầu trả thiết bị cho đơn '||r.rental_code||'.','/owner/returns' FROM rentals r JOIN rental_items ri ON ri.rental_id=r.id JOIN products p ON p.id=ri.product_id WHERE r.id=?",rentalId);
        jdbc.update("UPDATE rentals SET status='RETURN_PENDING' WHERE id=?",rentalId);
    }

    @Transactional(readOnly = true)
    public List<RentalChatResponse> getRentalChats(long renterId, long rentalId) {
        requireRenterRental(renterId, rentalId);
        return jdbc.query("""
                WITH owners AS (
                    SELECT DISTINCT p.owner_id, COALESCE(u.full_name,u.email,'Chủ thiết bị') owner_name
                    FROM rental_items ri JOIN products p ON p.id=ri.product_id JOIN users u ON u.id=p.owner_id
                    WHERE ri.rental_id=?
                )
                SELECT o.owner_id,o.owner_name,last.body last_message,last.created_at last_at,
                       (SELECT COUNT(*) FROM owner_chat_messages m WHERE m.rental_id=?
                         AND m.sender_id=o.owner_id AND m.receiver_id=? AND m.read_at IS NULL) unread
                FROM owners o
                LEFT JOIN LATERAL (SELECT body,created_at FROM owner_chat_messages m
                                   WHERE m.rental_id=? AND m.sender_id=o.owner_id AND m.receiver_id=?
                                   ORDER BY m.id DESC LIMIT 1) last ON TRUE
                ORDER BY last.created_at DESC NULLS LAST,o.owner_name
                """, (rs,n)->new RentalChatResponse(rs.getLong("owner_id"),rs.getString("owner_name"),
                rs.getString("last_message"),rs.getTimestamp("last_at")==null?null:rs.getTimestamp("last_at").toLocalDateTime(),
                rs.getLong("unread")),rentalId,rentalId,renterId,rentalId,renterId);
    }

    @Transactional(readOnly = true)
    public List<RenterChatConversationResponse> getRenterChatConversations(long renterId) {
        return jdbc.query("""
                WITH conversations AS (
                    SELECT DISTINCT r.id AS rental_id,r.rental_code,r.renter_id,p.owner_id,
                           COALESCE(owner.full_name,owner.email,'Chủ thiết bị') AS owner_name
                    FROM rentals r
                    JOIN rental_items ri ON ri.rental_id=r.id
                    JOIN products p ON p.id=ri.product_id
                    JOIN users owner ON owner.id=p.owner_id
                    WHERE r.renter_id=?
                )
                SELECT c.rental_id,c.rental_code,c.owner_id,c.owner_name,last.body AS last_message,
                       last.created_at AS last_message_at,
                       (SELECT COUNT(*) FROM owner_chat_messages incoming
                        WHERE incoming.rental_id=c.rental_id AND incoming.sender_id=c.owner_id
                          AND incoming.receiver_id=c.renter_id AND incoming.read_at IS NULL) AS unread_count
                FROM conversations c
                JOIN LATERAL (
                    SELECT m.body,m.created_at
                    FROM owner_chat_messages m
                    WHERE m.rental_id=c.rental_id
                      AND ((m.sender_id=c.owner_id AND m.receiver_id=c.renter_id)
                        OR (m.sender_id=c.renter_id AND m.receiver_id=c.owner_id))
                    ORDER BY m.id DESC LIMIT 1
                ) last ON TRUE
                ORDER BY last.created_at DESC,c.rental_id DESC,c.owner_id
                """,(rs,n)->new RenterChatConversationResponse(rs.getLong("rental_id"),rs.getString("rental_code"),
                rs.getLong("owner_id"),rs.getString("owner_name"),rs.getString("last_message"),
                rs.getTimestamp("last_message_at").toLocalDateTime(),rs.getLong("unread_count")),renterId);
    }

    @Transactional
    public List<RentalChatMessageResponse> getRentalChatMessages(long renterId,long rentalId,long ownerId) {
        requireRentalOwner(renterId,rentalId,ownerId);
        jdbc.update("UPDATE owner_chat_messages SET read_at=CURRENT_TIMESTAMP WHERE rental_id=? AND sender_id=? AND receiver_id=? AND read_at IS NULL",
                rentalId,ownerId,renterId);
        return jdbc.query("""
                SELECT m.id,m.sender_id,COALESCE(u.full_name,u.email,'Người dùng') sender_name,m.body,m.created_at
                FROM owner_chat_messages m JOIN users u ON u.id=m.sender_id
                WHERE m.rental_id=? AND ((m.sender_id=? AND m.receiver_id=?) OR (m.sender_id=? AND m.receiver_id=?))
                ORDER BY m.id
                """,(rs,n)->new RentalChatMessageResponse(rs.getLong("id"),rs.getLong("sender_id"),
                rs.getString("sender_name"),rs.getString("body"),rs.getTimestamp("created_at").toLocalDateTime(),
                rs.getLong("sender_id")==renterId),rentalId,renterId,ownerId,ownerId,renterId);
    }

    @Transactional
    public RentalChatMessageResponse sendRentalChatMessage(long renterId,long rentalId,long ownerId,
            SendRentalChatMessageRequest request) {
        String body=request.body().trim();
        if(body.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Tin nhắn không được để trống.");
        if(body.length()>2000) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Tin nhắn tối đa 2.000 ký tự.");
        requireRentalOwner(renterId,rentalId,ownerId);
        Long id=jdbc.queryForObject("INSERT INTO owner_chat_messages(rental_id,sender_id,receiver_id,body) VALUES(?,?,?,?) RETURNING id",
                Long.class,rentalId,renterId,ownerId,body);
        jdbc.update("INSERT INTO user_notifications(user_id,type,title,message,target_url) VALUES(?,?,?,?,?)",
                ownerId,"CHAT","Tin nhắn mới từ người thuê",body,"/owner/messages");
        return jdbc.queryForObject("""
                SELECT m.id,m.sender_id,COALESCE(u.full_name,u.email,'Người dùng') sender_name,m.body,m.created_at
                FROM owner_chat_messages m JOIN users u ON u.id=m.sender_id WHERE m.id=?
                """,(rs,n)->new RentalChatMessageResponse(rs.getLong("id"),rs.getLong("sender_id"),
                rs.getString("sender_name"),rs.getString("body"),rs.getTimestamp("created_at").toLocalDateTime(),true),id);
    }

    private void requireRenterRental(long renterId,long rentalId) {
        Integer count=jdbc.queryForObject("SELECT COUNT(*) FROM rentals WHERE id=? AND renter_id=?",Integer.class,rentalId,renterId);
        if(count==null||count==0) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Không tìm thấy đơn thuê.");
    }

    private void requireRentalOwner(long renterId,long rentalId,long ownerId) {
        Integer count=jdbc.queryForObject("""
                SELECT COUNT(*) FROM rentals r JOIN rental_items ri ON ri.rental_id=r.id JOIN products p ON p.id=ri.product_id
                WHERE r.id=? AND r.renter_id=? AND p.owner_id=?
                """,Integer.class,rentalId,renterId,ownerId);
        if(count==null||count==0) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Không tìm thấy cuộc trò chuyện.");
    }

    private void validateSchedule(ShoppingItemResponse item) {
        List<Boolean> available=jdbc.query("SELECT is_available FROM owner_product_schedules WHERE product_id=?",(rs,n)->rs.getBoolean(1),item.productId());
        if(!available.isEmpty()&&!available.get(0)) throw new ResponseStatusException(HttpStatus.CONFLICT,"Thiết bị đang tạm ngừng nhận lịch thuê.");
        Integer blocked=jdbc.queryForObject("SELECT COUNT(*) FROM owner_product_blocked_dates WHERE product_id=? AND blocked_date>=? AND blocked_date<?",Integer.class,item.productId(),item.startDate(),item.endDate());
        if(blocked!=null&&blocked>0) throw new ResponseStatusException(HttpStatus.CONFLICT,"Khoảng ngày thuê có ngày Owner đã chặn. Vui lòng chọn ngày khác.");
    }

    private BigDecimal calculateScheduledSubtotal(ShoppingItemResponse item) {
        BigDecimal weekend=jdbc.query("SELECT weekend_price FROM owner_product_schedules WHERE product_id=?",(rs,n)->rs.getBigDecimal(1),item.productId()).stream().findFirst().orElse(null);
        BigDecimal total=BigDecimal.ZERO;
        for(LocalDate date=item.startDate();date.isBefore(item.endDate());date=date.plusDays(1)) {
            boolean weekendDay=date.getDayOfWeek()==java.time.DayOfWeek.SATURDAY||date.getDayOfWeek()==java.time.DayOfWeek.SUNDAY;
            total=total.add(weekendDay&&weekend!=null?weekend:item.price());
        }
        return total.multiply(BigDecimal.valueOf(item.quantity()));
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
                SELECT ri.id rental_item_id,ri.product_id, p.name, COALESCE(image.image_url, '') AS image_key,
                       ri.quantity, ri.start_date, ri.end_date, ri.daily_price, ri.subtotal,
                       damage.description damage_description,damage.estimated_amount damage_amount,damage.status damage_status,
                       dispute.status dispute_status,settlement.refunded_amount deposit_refunded,
                       settlement.deducted_amount deposit_deducted,settlement.status deposit_status
                FROM rental_items ri JOIN products p ON p.id = ri.product_id
                LEFT JOIN LATERAL (
                    SELECT image_url FROM product_images WHERE product_id = p.id
                    ORDER BY is_primary DESC NULLS LAST, id LIMIT 1
                ) image ON TRUE
                LEFT JOIN damage_reports damage ON damage.rental_item_id=ri.id
                LEFT JOIN LATERAL (SELECT status FROM rental_disputes WHERE rental_item_id=ri.id ORDER BY id DESC LIMIT 1) dispute ON TRUE
                LEFT JOIN deposit_settlements settlement ON settlement.rental_item_id=ri.id
                WHERE ri.rental_id = ? ORDER BY ri.id
                """, (rs, rowNum) -> new RentalItemDetail(
                rs.getLong("rental_item_id"),rs.getLong("product_id"), rs.getString("name"), rs.getString("image_key"), rs.getInt("quantity"),
                rs.getObject("start_date", LocalDate.class), rs.getObject("end_date", LocalDate.class),
                zero(rs.getBigDecimal("daily_price")), zero(rs.getBigDecimal("subtotal")),
                rs.getString("damage_description"),zero(rs.getBigDecimal("damage_amount")),rs.getString("damage_status"),
                rs.getString("dispute_status"),zero(rs.getBigDecimal("deposit_refunded")),
                zero(rs.getBigDecimal("deposit_deducted")),rs.getString("deposit_status")
        ), rentalId);
    }

    private CartResponse calculateCart(List<ShoppingItemResponse> items, long userId) {
        BigDecimal rentalSubtotal = BigDecimal.ZERO;
        BigDecimal studentDiscountAmount = BigDecimal.ZERO;
        BigDecimal depositTotal = BigDecimal.ZERO;
        boolean studentDiscountEligible = hasApprovedStudentCard(userId);
        for (ShoppingItemResponse item : items) {
            if (item.startDate() != null && item.endDate() != null && item.endDate().isAfter(item.startDate())) {
                BigDecimal itemSubtotal = calculateScheduledSubtotal(item);
                rentalSubtotal = rentalSubtotal.add(itemSubtotal);
                if (studentDiscountEligible) studentDiscountAmount = studentDiscountAmount.add(calculateStudentDiscount(itemSubtotal));
            }
            depositTotal = depositTotal.add(item.depositAmount().multiply(BigDecimal.valueOf(item.quantity())));
        }
        BigDecimal rentalTotal = rentalSubtotal.subtract(studentDiscountAmount);
        BigDecimal serviceFee = rentalTotal.multiply(SERVICE_FEE_RATE).setScale(0, RoundingMode.HALF_UP);
        return new CartResponse(items, rentalSubtotal, studentDiscountAmount, studentDiscountEligible,
                rentalTotal, depositTotal, serviceFee,
                rentalTotal.add(depositTotal).add(serviceFee));
    }

    private BigDecimal calculateStudentDiscount(BigDecimal rentalSubtotal) {
        return rentalSubtotal.multiply(STUDENT_DISCOUNT_RATE).setScale(0, RoundingMode.HALF_UP);
    }

    private boolean hasApprovedStudentCard(long userId) {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM account_verifications WHERE user_id = ? AND student_card_status = 'APPROVED'",
                Integer.class, userId);
        return count != null && count > 0;
    }

    private void requireVerifiedIdentity(long userId, String action) {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM account_verifications WHERE user_id = ? AND identity_status = 'APPROVED'",
                Integer.class, userId);
        if (count == null || count == 0) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Bạn cần gửi CCCD và chờ Admin duyệt trong Cài đặt tài khoản → Xác minh cá nhân trước khi " + action + ".");
        }
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
        List<ProductRow> products = jdbc.query("SELECT owner_id, COALESCE(stock, 0) AS available_quantity FROM products WHERE id = ? AND status = 'ACTIVE'",
                (rs, rowNum) -> new ProductRow(rs.getInt("available_quantity"), rs.getLong("owner_id")), productId);
        if (products.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy thiết bị đang hoạt động.");
        return products.get(0);
    }

    private ProductRow lockActiveProductAvailability(long productId, long cartId) {
        List<Long> lockedOwners = jdbc.query("""
                SELECT owner_id FROM products WHERE id = ? AND status = 'ACTIVE' FOR UPDATE
                """, (rs, rowNum) -> rs.getLong("owner_id"), productId);
        if (lockedOwners.isEmpty()) {
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
        return new ProductRow(available == null ? 0 : available, lockedOwners.get(0));
    }

    private void rejectOwnerRenting(long userId, ProductRow product) {
        if (product.ownerId() == userId) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Bạn không thể thuê sản phẩm do chính mình đăng.");
        }
    }

    private void releaseExpiredCartItems(long cartId) {
        jdbc.update("DELETE FROM cart_items WHERE cart_id = ? AND reserved_until <= CURRENT_TIMESTAMP", cartId);
    }

    private void releaseOwnerCartItems(long userId, long cartId) {
        jdbc.update("""
                DELETE FROM cart_items ci
                USING products p
                WHERE ci.product_id = p.id AND ci.cart_id = ? AND p.owner_id = ?
                """, cartId, userId);
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

    private record ProductRow(int availableQuantity, long ownerId) {}
    private record CartItemRow(long productId, int quantity, LocalDate startDate, LocalDate endDate) {}
}
