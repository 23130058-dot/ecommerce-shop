package com.example.ecommerceshop.owner;

import com.example.ecommerceshop.owner.OwnerDtos.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class OwnerWorkspaceService {
    private final JdbcTemplate jdbc;

    public OwnerWorkspaceService(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @Transactional(readOnly = true)
    public OwnerDashboardResponse dashboard(long ownerId) {
        OwnerDashboardStats stats = jdbc.queryForObject("""
                SELECT
                    (SELECT COUNT(*) FROM products WHERE owner_id = ?) AS total_products,
                    (SELECT COUNT(DISTINCT ri.rental_id)
                     FROM rental_items ri JOIN products p ON p.id = ri.product_id
                     WHERE p.owner_id = ? AND UPPER(COALESCE(ri.status, '')) IN
                       ('CONFIRMED','ACTIVE','IN_PROGRESS','RENTING','RETURN_PENDING','RETURN_REQUESTED','AWAITING_RETURN')) AS active_rentals,
                    (SELECT COUNT(DISTINCT ri.rental_id)
                     FROM rental_items ri JOIN products p ON p.id = ri.product_id
                     WHERE p.owner_id = ? AND UPPER(COALESCE(ri.status, '')) = 'COMPLETED') AS completed_rentals,
                    (SELECT COUNT(DISTINCT ri.rental_id)
                     FROM rental_items ri JOIN products p ON p.id = ri.product_id
                     WHERE p.owner_id = ? AND UPPER(COALESCE(ri.status, '')) = 'PENDING'
                       AND (SELECT UPPER(COALESCE(pay.status, '')) FROM payments pay
                            WHERE pay.rental_id = ri.rental_id ORDER BY pay.id DESC LIMIT 1)
                           IN ('PAID','SUCCESS','COMPLETED')) AS pending_requests,
                    (SELECT COALESCE(AVG(rating), 0) FROM reviews
                     WHERE reviewed_user_id = ? AND is_public = TRUE) AS average_rating,
                    (SELECT COALESCE(SUM(ri.subtotal), 0)
                     FROM rental_items ri JOIN products p ON p.id = ri.product_id
                     WHERE p.owner_id = ? AND UPPER(COALESCE(ri.status, '')) <> 'CANCELLED'
                       AND EXISTS (SELECT 1 FROM payments pay WHERE pay.rental_id = ri.rental_id
                                   AND UPPER(COALESCE(pay.status, '')) IN ('PAID','SUCCESS','COMPLETED')
                                   AND pay.paid_at >= date_trunc('month', CURRENT_DATE)
                                   AND pay.paid_at < date_trunc('month', CURRENT_DATE) + interval '1 month')) AS revenue_this_month
                """, (rs, n) -> new OwnerDashboardStats(
                rs.getLong("total_products"), rs.getLong("active_rentals"),
                rs.getLong("completed_rentals"), rs.getLong("pending_requests"),
                rs.getBigDecimal("average_rating"), rs.getBigDecimal("revenue_this_month")),
                ownerId, ownerId, ownerId, ownerId, ownerId, ownerId);

        String fullName = jdbc.query("SELECT COALESCE(full_name, email, 'Chủ thiết bị') FROM users WHERE id = ?",
                rs -> rs.next() ? rs.getString(1) : "Chủ thiết bị", ownerId);
        List<BookingResponse> recentBookings = jdbc.query("""
                SELECT r.id AS rental_id, r.rental_code, COALESCE(u.full_name, u.email, 'Khách thuê') AS renter_name,
                       COALESCE(u.phone, r.contact_phone, '') AS renter_phone,
                       STRING_AGG(p.name || ' × ' || ri.quantity, ', ' ORDER BY ri.id) AS product_names,
                       MIN(ri.start_date) AS start_date, MAX(ri.end_date) AS end_date,
                       COALESCE(SUM(ri.subtotal), 0) AS rental_amount,
                       COALESCE(SUM(p.deposit_amount * ri.quantity), 0) AS deposit_amount,
                       CASE
                           WHEN BOOL_AND(UPPER(COALESCE(ri.status, r.status, '')) = 'COMPLETED') THEN 'COMPLETED'
                           WHEN BOOL_AND(UPPER(COALESCE(ri.status, r.status, '')) IN ('CONFIRMED','ACTIVE','IN_PROGRESS','RENTING')) THEN 'CONFIRMED'
                           WHEN BOOL_OR(UPPER(COALESCE(ri.status, r.status, '')) IN ('ACTIVE','IN_PROGRESS','RENTING')) THEN 'ACTIVE'
                           WHEN BOOL_OR(UPPER(COALESCE(ri.status, r.status, '')) = 'PENDING') THEN 'PENDING'
                           ELSE MAX(r.status)
                       END AS status,
                       COALESCE(payment.status, 'UNPAID') AS payment_status, r.created_at
                FROM rentals r JOIN users u ON u.id = r.renter_id
                JOIN rental_items ri ON ri.rental_id = r.id JOIN products p ON p.id = ri.product_id
                LEFT JOIN LATERAL (SELECT status FROM payments WHERE rental_id = r.id ORDER BY id DESC LIMIT 1) payment ON TRUE
                WHERE p.owner_id = ? AND UPPER(COALESCE(ri.status, '')) = 'PENDING'
                  AND UPPER(COALESCE(payment.status, '')) IN ('PAID','SUCCESS','COMPLETED')
                GROUP BY r.id, r.rental_code, u.full_name, u.email, u.phone, r.contact_phone, payment.status, r.created_at
                ORDER BY r.created_at DESC, r.id DESC LIMIT 5
                """, (rs, n) -> new BookingResponse(rs.getLong("rental_id"), rs.getString("rental_code"),
                rs.getString("renter_name"), rs.getString("renter_phone"), rs.getString("product_names"),
                rs.getObject("start_date", LocalDate.class), rs.getObject("end_date", LocalDate.class),
                rs.getBigDecimal("rental_amount"), rs.getBigDecimal("deposit_amount"), rs.getString("status"),
                rs.getString("payment_status"), local(rs.getTimestamp("created_at"))), ownerId);

        List<OwnerDashboardProduct> recentProducts = jdbc.query("""
                SELECT p.id, p.name, p.daily_price, COALESCE(img.image_url, '') AS image_key,
                       COALESCE(p.stock, 0) AS available_quantity, p.status,
                       COALESCE(rented.quantity, 0)::integer AS rented_quantity
                FROM products p
                LEFT JOIN LATERAL (SELECT image_url FROM product_images WHERE product_id = p.id
                                   ORDER BY is_primary DESC NULLS LAST, id LIMIT 1) img ON TRUE
                LEFT JOIN LATERAL (SELECT SUM(ri.quantity) AS quantity FROM rental_items ri
                                   WHERE ri.product_id = p.id AND UPPER(COALESCE(ri.status, '')) IN
                                   ('PENDING','CONFIRMED','ACTIVE','IN_PROGRESS','RENTING','RETURN_PENDING','RETURN_REQUESTED','AWAITING_RETURN')) rented ON TRUE
                WHERE p.owner_id = ? ORDER BY p.created_at DESC, p.id DESC LIMIT 5
                """, (rs, n) -> new OwnerDashboardProduct(rs.getLong("id"), rs.getString("name"),
                rs.getBigDecimal("daily_price"), rs.getString("image_key"), rs.getInt("available_quantity"),
                rs.getInt("rented_quantity"), rs.getString("status")), ownerId);

        List<TransactionResponse> recentTransactions = transactionRows(ownerId, true);
        return new OwnerDashboardResponse(fullName, stats.totalProducts(), stats.activeRentals(),
                stats.completedRentals(), stats.pendingRequests(), stats.averageRating(),
                stats.revenueThisMonth(), recentBookings, recentProducts, recentTransactions);
    }

    private record OwnerDashboardStats(long totalProducts, long activeRentals, long completedRentals,
                                       long pendingRequests, BigDecimal averageRating,
                                       BigDecimal revenueThisMonth) {}

    @Transactional(readOnly = true)
    public List<ScheduleResponse> schedules(long ownerId) {
        return jdbc.query("""
                SELECT p.id, p.name, COALESCE(img.image_url, '') image_key, p.daily_price,
                       COALESCE(s.weekend_price, p.daily_price) weekend_price, p.deposit_amount,
                       COALESCE(s.is_available, TRUE) available,
                       COALESCE((SELECT array_agg(blocked_date ORDER BY blocked_date)
                                 FROM owner_product_blocked_dates d WHERE d.product_id = p.id), ARRAY[]::date[]) blocked_dates
                FROM products p
                LEFT JOIN owner_product_schedules s ON s.product_id = p.id
                LEFT JOIN LATERAL (SELECT image_url FROM product_images WHERE product_id=p.id
                                   ORDER BY is_primary DESC NULLS LAST, id LIMIT 1) img ON TRUE
                WHERE p.owner_id = ? ORDER BY p.name
                """, (rs, n) -> {
            java.sql.Array array = rs.getArray("blocked_dates");
            List<LocalDate> dates = List.of();
            if (array != null) {
                Object[] values = (Object[]) array.getArray();
                dates = java.util.Arrays.stream(values).map(v -> v instanceof java.sql.Date d ? d.toLocalDate() : LocalDate.parse(v.toString())).toList();
                array.free();
            }
            return new ScheduleResponse(rs.getLong("id"), rs.getString("name"), rs.getString("image_key"),
                    rs.getBigDecimal("daily_price"), rs.getBigDecimal("weekend_price"),
                    rs.getBigDecimal("deposit_amount"), rs.getBoolean("available"), dates);
        }, ownerId);
    }

    @Transactional
    public ScheduleResponse saveSchedule(long ownerId, long productId, SaveScheduleRequest request) {
        requireOwnedProduct(ownerId, productId);
        List<LocalDate> blocked = request.blockedDates() == null ? List.of() : request.blockedDates().stream().distinct().sorted().toList();
        if (blocked.size() > 366) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không thể chặn quá 366 ngày cùng lúc.");
        jdbc.update("UPDATE products SET daily_price=?, deposit_amount=? WHERE id=? AND owner_id=?",
                request.dailyPrice(), request.depositAmount(), productId, ownerId);
        jdbc.update("""
                INSERT INTO owner_product_schedules(product_id, weekend_price, is_available, updated_at)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(product_id) DO UPDATE SET weekend_price=EXCLUDED.weekend_price,
                    is_available=EXCLUDED.is_available, updated_at=CURRENT_TIMESTAMP
                """, productId, request.weekendPrice(), request.available());
        jdbc.update("DELETE FROM owner_product_blocked_dates WHERE product_id=?", productId);
        if (!blocked.isEmpty()) jdbc.batchUpdate("INSERT INTO owner_product_blocked_dates(product_id, blocked_date) VALUES (?, ?)",
                blocked, 100, (ps, date) -> { ps.setLong(1, productId); ps.setObject(2, date); });
        return schedules(ownerId).stream().filter(item -> item.productId().equals(productId)).findFirst().orElseThrow();
    }

    @Transactional(readOnly = true)
    public List<ReturnResponse> returns(long ownerId) {
        return jdbc.query("""
                SELECT ri.id item_id, r.id rental_id, r.rental_code, COALESCE(u.full_name, r.contact_name, 'Khách thuê') renter_name,
                       p.name product_name, ri.quantity, ri.start_date, ri.end_date, ri.status,
                       ri.subtotal estimated_amount, d.description damage_description, d.estimated_amount damage_amount,
                       d.status damage_status, r.created_at
                FROM rental_items ri JOIN rentals r ON r.id=ri.rental_id
                JOIN products p ON p.id=ri.product_id LEFT JOIN users u ON u.id=r.renter_id
                LEFT JOIN damage_reports d ON d.rental_item_id=ri.id
                WHERE p.owner_id=? AND UPPER(COALESCE(ri.status,'')) IN
                    ('RETURN_PENDING','RETURN_REQUESTED','AWAITING_RETURN','DAMAGE_REPORTED')
                ORDER BY r.created_at DESC, ri.id DESC
                """, (rs,n) -> new ReturnResponse(rs.getLong("item_id"),rs.getLong("rental_id"),rs.getString("rental_code"),
                rs.getString("renter_name"),rs.getString("product_name"),rs.getInt("quantity"),
                rs.getObject("start_date", LocalDate.class),rs.getObject("end_date", LocalDate.class),rs.getString("status"),
                rs.getBigDecimal("estimated_amount"),rs.getString("damage_description"),rs.getBigDecimal("damage_amount"),
                rs.getString("damage_status"),local(rs.getTimestamp("created_at"))), ownerId);
    }

    @Transactional
    public void confirmReturn(long ownerId, long rentalItemId) {
        List<Long> ids = jdbc.query("""
                SELECT ri.id FROM rental_items ri JOIN products p ON p.id=ri.product_id
                WHERE ri.id=? AND p.owner_id=? AND UPPER(COALESCE(ri.status,'')) IN
                  ('RETURN_PENDING','RETURN_REQUESTED','AWAITING_RETURN','DAMAGE_REPORTED') FOR UPDATE
                """, (rs,n)->rs.getLong(1), rentalItemId, ownerId);
        if (ids.isEmpty()) throw new ResponseStatusException(HttpStatus.CONFLICT,"Thiết bị chưa có yêu cầu trả hoặc không thuộc tài khoản của bạn.");
        jdbc.update("UPDATE damage_reports SET status='REVIEWED' WHERE rental_item_id=? AND status='OPEN'",rentalItemId);
        jdbc.update("UPDATE rental_items SET status='COMPLETED' WHERE id=?",rentalItemId);
        jdbc.update("UPDATE products p SET stock=COALESCE(stock,0)+ri.quantity FROM rental_items ri WHERE ri.id=? AND p.id=ri.product_id",rentalItemId);
        notifyRentalRenter(rentalItemId,"RETURN","Đã xác nhận hoàn trả","Owner đã xác nhận thiết bị được trả.","/renter/orders");
        syncRentalStatus(rentalItemId);
    }

    @Transactional
    public void reportDamage(long ownerId, long rentalItemId, DamageReportRequest request) {
        requireOwnedRentalItem(ownerId, rentalItemId);
        List<String> statuses = jdbc.query("SELECT status FROM rental_items WHERE id=?",(rs,n)->rs.getString(1),rentalItemId);
        if (statuses.isEmpty() || !List.of("RETURN_PENDING","RETURN_REQUESTED","AWAITING_RETURN").contains(upper(statuses.get(0))))
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Chỉ có thể báo cáo thiết bị đang chờ xác nhận trả.");
        if (request.description().trim().length()>4000) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Mô tả tối đa 4.000 ký tự.");
        jdbc.update("INSERT INTO damage_reports(rental_item_id,owner_id,description,estimated_amount) VALUES(?,?,?,?)",
                rentalItemId,ownerId,request.description().trim(),request.estimatedAmount());
        jdbc.update("UPDATE rental_items SET status='DAMAGE_REPORTED' WHERE id=?",rentalItemId);
        notifyRentalRenter(rentalItemId,"DAMAGE","Owner gửi báo cáo hư hỏng",request.description().trim(),"/renter/orders");
    }

    @Transactional(readOnly = true)
    public WalletResponse wallet(long ownerId) {
        BigDecimal earnings = money("""
                SELECT COALESCE(SUM(ri.subtotal),0) FROM rental_items ri JOIN products p ON p.id=ri.product_id
                JOIN payments pay ON pay.rental_id=ri.rental_id
                WHERE p.owner_id=? AND UPPER(COALESCE(pay.status,'')) IN ('PAID','SUCCESS','COMPLETED')
                  AND UPPER(COALESCE(ri.status,''))<>'CANCELLED'
                """, ownerId);
        BigDecimal withdrawn = money("SELECT COALESCE(SUM(amount),0) FROM owner_withdrawal_requests WHERE owner_id=? AND status='COMPLETED'",ownerId);
        BigDecimal pending = money("SELECT COALESCE(SUM(amount),0) FROM owner_withdrawal_requests WHERE owner_id=? AND status='PENDING'",ownerId);
        return new WalletResponse(earnings.subtract(withdrawn).subtract(pending).max(BigDecimal.ZERO),earnings,withdrawn,pending);
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> transactions(long ownerId) {
        return transactionRows(ownerId, false);
    }

    private List<TransactionResponse> transactionRows(long ownerId, boolean recentOnly) {
        String sql = """
                SELECT * FROM (
                    SELECT r.id id, 'Thuê thiết bị · '||COALESCE(r.rental_code,'#'||r.id::text) title,
                           STRING_AGG(DISTINCT p.name, ', ' ORDER BY p.name) subtitle, 'RENTAL_INCOME' type,
                           SUM(ri.subtotal) amount, 'COMPLETED' status, MIN(pay.paid_at) created_at
                    FROM rentals r JOIN rental_items ri ON ri.rental_id=r.id JOIN products p ON p.id=ri.product_id
                    JOIN payments pay ON pay.rental_id=r.id
                    WHERE p.owner_id=? AND UPPER(COALESCE(pay.status,'')) IN ('PAID','SUCCESS','COMPLETED')
                      AND UPPER(COALESCE(ri.status,''))<>'CANCELLED'
                    GROUP BY r.id,r.rental_code
                    UNION ALL
                    SELECT -id, 'Yêu cầu rút tiền','Rút tiền thủ công','WITHDRAWAL',-amount,status,created_at
                    FROM owner_withdrawal_requests WHERE owner_id=?
                ) tx ORDER BY created_at DESC NULLS LAST,id DESC
                """ + (recentOnly ? " LIMIT 5" : "");
        return jdbc.query(sql,(rs,n)->new TransactionResponse(rs.getLong("id"),rs.getString("title"),rs.getString("subtitle"),
                rs.getString("type"),rs.getBigDecimal("amount"),rs.getString("status"),local(rs.getTimestamp("created_at"))),ownerId,ownerId);
    }

    @Transactional
    public WalletResponse requestWithdrawal(long ownerId, WithdrawalRequest request) {
        jdbc.query("SELECT id FROM users WHERE id=? FOR UPDATE",(rs,n)->rs.getLong(1),ownerId);
        WalletResponse current=wallet(ownerId);
        if(request.amount().compareTo(current.availableBalance())>0)
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Số dư khả dụng không đủ cho yêu cầu rút tiền.");
        jdbc.update("INSERT INTO owner_withdrawal_requests(owner_id,amount) VALUES(?,?)",ownerId,request.amount());
        notify(ownerId,"WALLET","Đã ghi nhận yêu cầu rút tiền","Yêu cầu rút "+request.amount().toPlainString()+"đ đang chờ xử lý.","/owner/transactions");
        return wallet(ownerId);
    }

    @Transactional(readOnly = true)
    public List<ReviewCandidateResponse> reviewCandidates(long ownerId) {
        return jdbc.query("""
                SELECT r.id rental_id,r.rental_code,r.renter_id,COALESCE(u.full_name,u.email,'Người thuê') renter_name,
                       STRING_AGG(DISTINCT p.name,', ' ORDER BY p.name) product_names,
                       MIN(ri.start_date) start_date,MAX(ri.end_date) end_date,
                       rev.rating,rev.comment,rev.id review_id
                FROM rentals r JOIN rental_items ri ON ri.rental_id=r.id JOIN products p ON p.id=ri.product_id
                JOIN users u ON u.id=r.renter_id LEFT JOIN reviews rev ON rev.rental_id=r.id AND rev.user_id=?
                WHERE p.owner_id=? AND NOT EXISTS (SELECT 1 FROM rental_items x WHERE x.rental_id=r.id AND x.status<>'COMPLETED')
                GROUP BY r.id,r.rental_code,r.renter_id,u.full_name,u.email,rev.rating,rev.comment,rev.id
                ORDER BY r.created_at DESC
                """,(rs,n)->new ReviewCandidateResponse(rs.getLong("rental_id"),rs.getString("rental_code"),rs.getLong("renter_id"),
                rs.getString("renter_name"),rs.getString("product_names"),rs.getObject("start_date",LocalDate.class),
                rs.getObject("end_date",LocalDate.class),rs.getObject("review_id")==null?false:true,
                (Integer)rs.getObject("rating"),rs.getString("comment")),ownerId,ownerId);
    }

    @Transactional
    public void submitReview(long ownerId, OwnerReviewRequest request) {
        List<Long> renters=jdbc.query("""
                SELECT r.renter_id FROM rentals r WHERE r.id=? AND EXISTS(
                  SELECT 1 FROM rental_items ri JOIN products p ON p.id=ri.product_id
                  WHERE ri.rental_id=r.id AND p.owner_id=?) AND NOT EXISTS(
                  SELECT 1 FROM rental_items ri WHERE ri.rental_id=r.id AND ri.status<>'COMPLETED')
                """,(rs,n)->rs.getLong(1),request.rentalId(),ownerId);
        if(renters.isEmpty()) throw new ResponseStatusException(HttpStatus.CONFLICT,"Chỉ có thể đánh giá đơn đã hoàn tất của sản phẩm bạn sở hữu.");
        int rating=Math.round((request.communicationRating()+request.punctualityRating()+request.careRating())/3.0f);
        jdbc.update("""
                INSERT INTO reviews(user_id,rental_id,rating,comment,reviewed_user_id,communication_rating,
                                    punctuality_rating,care_rating,equipment_condition,is_public)
                VALUES(?,?,?,?,?,?,?,?,?,?)
                """,ownerId,request.rentalId(),rating,request.comment()==null?"":request.comment().trim(),renters.get(0),
                request.communicationRating(),request.punctualityRating(),request.careRating(),request.equipmentCondition(),request.isPublic());
        notify(renters.get(0),"REVIEW","Owner đã gửi đánh giá", "Bạn có đánh giá mới từ Owner cho đơn thuê.","/renter/orders/"+request.rentalId());
    }

    @Transactional(readOnly = true)
    public List<ChatConversationResponse> chats(long ownerId) {
        return jdbc.query("""
                SELECT r.id,r.rental_code,r.renter_id,COALESCE(u.full_name,u.email,'Người thuê') renter_name,
                       COALESCE(last.body,'Bắt đầu cuộc trò chuyện về đơn thuê') last_message,last.created_at last_at,
                       (SELECT COUNT(*) FROM owner_chat_messages m WHERE m.rental_id=r.id AND m.receiver_id=? AND m.read_at IS NULL) unread
                FROM rentals r JOIN users u ON u.id=r.renter_id
                JOIN rental_items ri ON ri.rental_id=r.id JOIN products p ON p.id=ri.product_id
                LEFT JOIN LATERAL (SELECT body,created_at FROM owner_chat_messages
                                   WHERE rental_id=r.id AND (sender_id=? OR receiver_id=?) ORDER BY id DESC LIMIT 1) last ON TRUE
                WHERE p.owner_id=? GROUP BY r.id,r.rental_code,r.renter_id,u.full_name,u.email,last.body,last.created_at
                ORDER BY last.created_at DESC NULLS LAST,r.created_at DESC
                """,(rs,n)->new ChatConversationResponse(rs.getLong("id"),rs.getString("rental_code"),rs.getLong("renter_id"),
                rs.getString("renter_name"),rs.getString("last_message"),local(rs.getTimestamp("last_at")),rs.getLong("unread")),ownerId,ownerId,ownerId,ownerId);
    }

    @Transactional
    public List<ChatMessageResponse> messages(long ownerId,long rentalId) {
        Long renter=authorizedRenter(ownerId,rentalId);
        jdbc.update("UPDATE owner_chat_messages SET read_at=CURRENT_TIMESTAMP WHERE rental_id=? AND receiver_id=? AND read_at IS NULL",rentalId,ownerId);
        return jdbc.query("""
                SELECT m.id,m.sender_id,COALESCE(u.full_name,u.email,'Người dùng') sender_name,m.body,m.created_at
                FROM owner_chat_messages m JOIN users u ON u.id=m.sender_id
                WHERE m.rental_id=? AND (m.sender_id=? OR m.receiver_id=?) ORDER BY m.id
                """,(rs,n)->new ChatMessageResponse(rs.getLong("id"),rs.getLong("sender_id"),rs.getString("sender_name"),
                rs.getString("body"),local(rs.getTimestamp("created_at")),rs.getLong("sender_id")==ownerId),rentalId,ownerId,ownerId);
    }

    @Transactional
    public ChatMessageResponse sendMessage(long ownerId,long rentalId,SendChatMessageRequest request) {
        Long renter=authorizedRenter(ownerId,rentalId);
        String body=request.body().trim();
        if(body.length()>2000) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Tin nhắn tối đa 2.000 ký tự.");
        Long id=jdbc.queryForObject("INSERT INTO owner_chat_messages(rental_id,sender_id,receiver_id,body) VALUES(?,?,?,?) RETURNING id",Long.class,rentalId,ownerId,renter,body);
        notify(renter,"CHAT","Tin nhắn mới từ Owner",body,"/renter/orders/"+rentalId);
        return jdbc.queryForObject("""
                SELECT m.id,m.sender_id,u.full_name sender_name,m.body,m.created_at FROM owner_chat_messages m
                JOIN users u ON u.id=m.sender_id WHERE m.id=?
                """,(rs,n)->new ChatMessageResponse(rs.getLong(1),rs.getLong(2),rs.getString(3),rs.getString(4),local(rs.getTimestamp(5)),true),id);
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> notifications(long ownerId) {
        return jdbc.query("SELECT id,type,title,message,target_url,created_at,read_at FROM user_notifications WHERE user_id=? ORDER BY id DESC LIMIT 100",
                (rs,n)->new NotificationResponse(rs.getLong("id"),rs.getString("type"),rs.getString("title"),rs.getString("message"),
                        rs.getString("target_url"),local(rs.getTimestamp("created_at")),local(rs.getTimestamp("read_at"))),ownerId);
    }

    @Transactional
    public void markNotificationsRead(long ownerId) {
        jdbc.update("UPDATE user_notifications SET read_at=CURRENT_TIMESTAMP WHERE user_id=? AND read_at IS NULL",ownerId);
    }

    @Transactional
    public void cancelBooking(long ownerId,long rentalId) {
        jdbc.query("SELECT id FROM rentals WHERE id=? FOR UPDATE",(rs,n)->rs.getLong(1),rentalId);
        List<Long> items=jdbc.query("""
                SELECT ri.id FROM rental_items ri JOIN products p ON p.id=ri.product_id
                WHERE ri.rental_id=? AND p.owner_id=? AND ri.status IN ('PENDING','CONFIRMED')
                  AND ri.start_date>CURRENT_DATE FOR UPDATE
                """,(rs,n)->rs.getLong(1),rentalId,ownerId);
        if(items.isEmpty()) throw new ResponseStatusException(HttpStatus.CONFLICT,"Đơn không còn ở trạng thái có thể hủy hoặc ngày thuê đã bắt đầu.");
        for(Long itemId:items) {
            jdbc.update("UPDATE products p SET stock=COALESCE(stock,0)+ri.quantity FROM rental_items ri WHERE ri.id=? AND p.id=ri.product_id",itemId);
            jdbc.update("UPDATE rental_items SET status='CANCELLED' WHERE id=?",itemId);
        }
        BigDecimal remainingRent=money("SELECT COALESCE(SUM(subtotal),0) FROM rental_items WHERE rental_id=? AND status<>'CANCELLED'",rentalId);
        BigDecimal remainingDeposit=money("SELECT COALESCE(SUM(p.deposit_amount*ri.quantity),0) FROM rental_items ri JOIN products p ON p.id=ri.product_id WHERE ri.rental_id=? AND ri.status<>'CANCELLED'",rentalId);
        BigDecimal fee=remainingRent.multiply(new BigDecimal("0.05")).setScale(0,java.math.RoundingMode.HALF_UP);
        int active=jdbc.queryForObject("SELECT COUNT(*) FROM rental_items WHERE rental_id=? AND status<>'CANCELLED'",Integer.class,rentalId);
        jdbc.update("UPDATE rentals SET total_amount=?,deposit_amount=?,service_fee=?,status=CASE WHEN ?=0 THEN 'CANCELLED' ELSE status END WHERE id=?",
                remainingRent.add(remainingDeposit).add(fee),remainingDeposit,fee,active,rentalId);
        jdbc.update("UPDATE payments SET amount=? WHERE rental_id=? AND status IN ('PAID','SUCCESS','COMPLETED')",remainingRent.add(remainingDeposit).add(fee),rentalId);
        if(active==0) jdbc.update("UPDATE payments SET status='REFUNDED' WHERE rental_id=? AND status IN ('PAID','SUCCESS','COMPLETED')",rentalId);
        notifyRental(rentalId,"ORDER","Owner đã hủy sản phẩm trong đơn","Một hoặc nhiều thiết bị trong đơn thuê đã bị Owner hủy.","/renter/orders/"+rentalId);
    }

    private void requireOwnedProduct(long ownerId,long productId) {
        Integer count=jdbc.queryForObject("SELECT COUNT(*) FROM products WHERE id=? AND owner_id=?",Integer.class,productId,ownerId);
        if(count==null||count==0) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Không tìm thấy sản phẩm của bạn.");
    }
    private void requireOwnedRentalItem(long ownerId,long itemId) {
        Integer count=jdbc.queryForObject("SELECT COUNT(*) FROM rental_items ri JOIN products p ON p.id=ri.product_id WHERE ri.id=? AND p.owner_id=?",Integer.class,itemId,ownerId);
        if(count==null||count==0) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Không tìm thấy thiết bị trong đơn thuê.");
    }
    private Long authorizedRenter(long ownerId,long rentalId) {
        List<Long> renters=jdbc.query("SELECT r.renter_id FROM rentals r WHERE r.id=? AND EXISTS (SELECT 1 FROM rental_items ri JOIN products p ON p.id=ri.product_id WHERE ri.rental_id=r.id AND p.owner_id=?)",(rs,n)->rs.getLong(1),rentalId,ownerId);
        if(renters.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Không tìm thấy cuộc trò chuyện.");
        return renters.get(0);
    }
    private void notifyRentalRenter(long itemId,String type,String title,String message,String url) {
        jdbc.update("INSERT INTO user_notifications(user_id,type,title,message,target_url) SELECT r.renter_id,?,?,?,? FROM rental_items ri JOIN rentals r ON r.id=ri.rental_id WHERE ri.id=?",type,title,message,url,itemId);
    }
    private void notifyRental(long rentalId,String type,String title,String message,String url) {
        jdbc.update("INSERT INTO user_notifications(user_id,type,title,message,target_url) SELECT renter_id,?,?,?,? FROM rentals WHERE id=?",type,title,message,url,rentalId);
    }
    private void notify(long userId,String type,String title,String message,String url) {
        jdbc.update("INSERT INTO user_notifications(user_id,type,title,message,target_url) VALUES(?,?,?,?,?)",userId,type,title,message,url);
    }
    private void syncRentalStatus(long itemId) {
        jdbc.update("UPDATE rentals r SET status='COMPLETED' WHERE r.id=(SELECT rental_id FROM rental_items WHERE id=?) AND NOT EXISTS (SELECT 1 FROM rental_items WHERE rental_id=r.id AND status NOT IN ('COMPLETED','CANCELLED'))",itemId);
    }
    private BigDecimal money(String sql,Object... args) { BigDecimal value=jdbc.queryForObject(sql,BigDecimal.class,args); return value==null?BigDecimal.ZERO:value; }
    private String upper(String value) { return value==null?"":value.toUpperCase(java.util.Locale.ROOT); }
    private LocalDateTime local(Timestamp value) { return value==null?null:value.toLocalDateTime(); }
}
