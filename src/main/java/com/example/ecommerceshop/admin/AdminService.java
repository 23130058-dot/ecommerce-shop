package com.example.ecommerceshop.admin;

import com.example.ecommerceshop.admin.AdminDtos.CategoryRevenue;
import com.example.ecommerceshop.admin.AdminDtos.DashboardResponse;
import com.example.ecommerceshop.admin.AdminDtos.MonthlyRevenue;
import com.example.ecommerceshop.admin.AdminDtos.PageResponse;
import com.example.ecommerceshop.admin.AdminDtos.ProductAdminResponse;
import com.example.ecommerceshop.admin.AdminDtos.RecentActivity;
import com.example.ecommerceshop.admin.AdminDtos.RentalAdminDetail;
import com.example.ecommerceshop.admin.AdminDtos.RentalAdminResponse;
import com.example.ecommerceshop.admin.AdminDtos.RentalLineAdmin;
import com.example.ecommerceshop.admin.AdminDtos.UserPageResponse;
import com.example.ecommerceshop.admin.AdminDtos.UserResponse;
import com.example.ecommerceshop.admin.AdminDtos.UserSummary;
import com.example.ecommerceshop.admin.AdminDtos.UpdateProductRequest;
import com.example.ecommerceshop.admin.AdminDtos.RevenueTrendResponse;
import com.example.ecommerceshop.admin.AdminDtos.DailyRevenue;
import com.example.ecommerceshop.user.User;
import com.example.ecommerceshop.user.UserRepository;
import com.example.ecommerceshop.wallet.WalletService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Service
public class AdminService {
    private static final int MAX_PAGE_SIZE = 100;
    private static final String PAID_STATUSES = "'PAID', 'SUCCESS', 'COMPLETED'";
    private static final String COMPLETED_RENTAL_STATUSES = "'COMPLETED', 'COMPLETE', 'RETURNED', 'CLOSED'";

    private final UserRepository userRepository;
    private final JdbcTemplate jdbcTemplate;
    private final WalletService walletService;

    public AdminService(UserRepository userRepository, JdbcTemplate jdbcTemplate, WalletService walletService) {
        this.userRepository = userRepository;
        this.jdbcTemplate = jdbcTemplate;
        this.walletService = walletService;
    }

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard() {
        long totalUsers = scalarLong("SELECT COUNT(*) FROM users");
        long activeUsers = scalarLong("SELECT COUNT(*) FROM users WHERE UPPER(COALESCE(status, '')) = 'ACTIVE'");
        long newUsersThisMonth = scalarLong("""
                SELECT COUNT(*) FROM users
                WHERE created_at >= date_trunc('month', CURRENT_TIMESTAMP)
                  AND created_at < date_trunc('month', CURRENT_TIMESTAMP) + interval '1 month'
                """);
        long completedRentals = scalarLong("SELECT COUNT(*) FROM rentals WHERE UPPER(COALESCE(status, '')) IN (" + COMPLETED_RENTAL_STATUSES + ")");
        long pendingDevices = scalarLong("SELECT COUNT(*) FROM products WHERE UPPER(COALESCE(status, '')) IN ('PENDING', 'PENDING_APPROVAL', 'WAITING_APPROVAL')");
        long openDisputes = scalarLong("""
                SELECT
                    (SELECT COUNT(*) FROM marketplace_reports WHERE status IN ('OPEN', 'UNDER_REVIEW')) +
                    (SELECT COUNT(*) FROM rental_disputes WHERE status IN ('OPEN', 'UNDER_REVIEW'))
                """);
        long pendingVerifications = scalarLong("""
                SELECT COALESCE(COUNT(*) FILTER (WHERE student_card_status = 'PENDING'), 0) +
                       COALESCE(COUNT(*) FILTER (WHERE identity_status = 'PENDING'), 0)
                FROM account_verifications
                """);
        BigDecimal revenueThisMonth = scalarMoney("""
                SELECT COALESCE(SUM(amount), 0) FROM payments
                WHERE UPPER(COALESCE(status, '')) IN (%s)
                  AND paid_at >= date_trunc('month', CURRENT_TIMESTAMP)
                  AND paid_at < date_trunc('month', CURRENT_TIMESTAMP) + interval '1 month'
                """.formatted(PAID_STATUSES));

        return new DashboardResponse(totalUsers, activeUsers, newUsersThisMonth, completedRentals,
                pendingDevices, openDisputes, pendingVerifications, revenueThisMonth, getMonthlyRevenue(),
                getRevenueByCategory(), getRecentActivities());
    }

    @Transactional(readOnly = true)
    public UserPageResponse getUsers(String search, String role, String status, int page, int size) {
        String normalizedSearch = search == null ? "" : search.trim();
        Long idSearch = parseIdSearch(normalizedSearch);
        String normalizedRole = normalizeRole(role);
        String normalizedStatus = normalizeStatusFilter(status);
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        StringBuilder where = new StringBuilder(" WHERE TRUE");
        List<Object> args = new ArrayList<>();
        if (!normalizedSearch.isBlank()) {
            where.append(" AND (LOWER(CONCAT_WS(' ', COALESCE(u.full_name, ''), COALESCE(u.email, ''))) LIKE ? " +
                    "OR CAST(u.id AS varchar) LIKE ?");
            String pattern = "%" + normalizedSearch.toLowerCase(Locale.ROOT) + "%";
            args.add(pattern);
            args.add("%" + normalizedSearch.replaceFirst("(?i)^USR-", "") + "%");
            if (idSearch != null) {
                where.append(" OR u.id = ?");
                args.add(idSearch);
            }
            where.append(")");
        }
        if (normalizedRole != null) {
            where.append(" AND UPPER(COALESCE(u.role, '')) = ?");
            args.add(normalizedRole);
        }
        if (normalizedStatus != null) {
            where.append(" AND UPPER(COALESCE(u.status, '')) = ?");
            args.add(normalizedStatus);
        }
        Long filteredCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM users u" + where, Long.class, args.toArray());
        List<Object> queryArgs = new ArrayList<>(args);
        queryArgs.add(safeSize);
        queryArgs.add((long) safePage * safeSize);
        List<UserResponse> results = jdbcTemplate.query("""
                SELECT u.id, u.full_name, u.email, u.phone, u.role, u.status, u.created_at,
                       (SELECT COUNT(*) FROM rentals r WHERE r.renter_id = u.id) AS rental_count
                FROM users u
                """ + where + " ORDER BY u.created_at DESC NULLS LAST, u.id DESC LIMIT ? OFFSET ?",
                (rs, rowNum) -> {
                    Timestamp createdAt = rs.getTimestamp("created_at");
                    String userStatus = "ACTIVE".equalsIgnoreCase(rs.getString("status")) ? "ACTIVE" : "LOCKED";
                    return new UserResponse(rs.getLong("id"), rs.getString("full_name"), rs.getString("email"),
                            rs.getString("phone"), rs.getString("role"), userStatus,
                            createdAt == null ? null : createdAt.toLocalDateTime(), rs.getLong("rental_count"));
                }, queryArgs.toArray());
        long totalUsers = scalarLong("SELECT COUNT(*) FROM users");
        long activeUsers = scalarLong("SELECT COUNT(*) FROM users WHERE UPPER(COALESCE(status, '')) = 'ACTIVE'");
        long newUsers = scalarLong("""
                SELECT COUNT(*) FROM users
                WHERE created_at >= date_trunc('month', CURRENT_TIMESTAMP)
                  AND created_at < date_trunc('month', CURRENT_TIMESTAMP) + interval '1 month'
                """);
        UserSummary summary = new UserSummary(totalUsers, activeUsers, Math.max(0, totalUsers - activeUsers), newUsers);
        long totalElements = filteredCount == null ? 0 : filteredCount;
        return new UserPageResponse(results, safePage, safeSize, totalElements,
                (int) Math.ceil((double) totalElements / safeSize), summary);
    }

    @Transactional
    public UserResponse updateUserStatus(long userId, String requestedStatus, String currentAdminEmail) {
        String status = requestedStatus.toUpperCase(Locale.ROOT);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng."));

        if ("LOCKED".equals(status) && user.getEmail().equalsIgnoreCase(currentAdminEmail)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bạn không thể khóa tài khoản quản trị đang đăng nhập.");
        }
        if ("LOCKED".equals(status) && "ADMIN".equalsIgnoreCase(user.getRole())
                && "ACTIVE".equalsIgnoreCase(user.getStatus())
                && userRepository.countByRoleIgnoreCaseAndStatusIgnoreCase("ADMIN", "ACTIVE") <= 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Không thể khóa quản trị viên hoạt động cuối cùng.");
        }

        user.setStatus(status);
        User saved = userRepository.save(user);
        return toUserResponse(saved, countRentals(saved.getId()));
    }

    @Transactional
    public UserResponse updateUserRole(long userId, String requestedRole, String currentAdminEmail) {
        String role = normalizeRole(requestedRole);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng."));
        if (user.getEmail().equalsIgnoreCase(currentAdminEmail) && !role.equalsIgnoreCase(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bạn không thể đổi vai trò tài khoản quản trị đang đăng nhập.");
        }
        if ("ADMIN".equalsIgnoreCase(user.getRole()) && !"ADMIN".equals(role)
                && "ACTIVE".equalsIgnoreCase(user.getStatus())
                && userRepository.countByRoleIgnoreCaseAndStatusIgnoreCase("ADMIN", "ACTIVE") <= 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Không thể hạ quyền quản trị viên hoạt động cuối cùng.");
        }
        user.setRole(role);
        User saved = userRepository.save(user);
        return toUserResponse(saved, countRentals(saved.getId()));
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductAdminResponse> getProducts(String search, String requestedStatus, int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        String normalizedSearch = search == null ? "" : search.trim().toLowerCase(Locale.ROOT);
        String status = normalizeProductStatusFilter(requestedStatus);
        String joins = """
                FROM products p
                JOIN users owner ON owner.id = p.owner_id
                LEFT JOIN categories c ON c.id = p.category_id
                LEFT JOIN brands b ON b.id = p.brand_id
                LEFT JOIN LATERAL (
                    SELECT image_url FROM product_images
                    WHERE product_id = p.id
                    ORDER BY is_primary DESC NULLS LAST, id LIMIT 1
                ) image ON TRUE
                """;
        StringBuilder where = new StringBuilder(" WHERE TRUE");
        List<Object> args = new ArrayList<>();
        if (!normalizedSearch.isBlank()) {
            where.append(" AND LOWER(CONCAT_WS(' ', p.id::text, p.name, owner.full_name, owner.email, c.name, b.name)) LIKE ?");
            args.add("%" + normalizedSearch + "%");
        }
        if (status != null) {
            if ("PENDING".equals(status)) {
                where.append(" AND UPPER(COALESCE(p.status, '')) IN ('PENDING', 'PENDING_APPROVAL', 'WAITING_APPROVAL')");
            } else {
                where.append(" AND UPPER(COALESCE(p.status, '')) = ?");
                args.add(status);
            }
        }
        Long total = jdbcTemplate.queryForObject("SELECT COUNT(*) " + joins + where, Long.class, args.toArray());
        List<Object> queryArgs = new ArrayList<>(args);
        queryArgs.add(safeSize);
        queryArgs.add((long) safePage * safeSize);
        List<ProductAdminResponse> products = jdbcTemplate.query("""
                SELECT p.id, p.name, owner.full_name AS owner_name, owner.email AS owner_email,
                       c.name AS category_name, b.name AS brand_name, p.daily_price, p.deposit_amount,
                       COALESCE(p.stock, 0) AS stock, p.status, COALESCE(image.image_url, '') AS image_key,
                       p.description, p.created_at
                """ + joins + where + " ORDER BY p.created_at DESC NULLS LAST, p.id DESC LIMIT ? OFFSET ?",
                (rs, rowNum) -> new ProductAdminResponse(
                        rs.getLong("id"), rs.getString("name"), rs.getString("owner_name"),
                        rs.getString("owner_email"), rs.getString("category_name"), rs.getString("brand_name"),
                        rs.getBigDecimal("daily_price"), rs.getBigDecimal("deposit_amount"), rs.getInt("stock"),
                        rs.getString("status"), rs.getString("image_key"), rs.getString("description"),
                        rs.getTimestamp("created_at") == null ? null : rs.getTimestamp("created_at").toLocalDateTime()),
                queryArgs.toArray());
        long totalElements = total == null ? 0 : total;
        return new PageResponse<>(products, safePage, safeSize, totalElements,
                (int) Math.ceil((double) totalElements / safeSize));
    }

    @Transactional
    public void updateProductStatus(long productId, String requestedStatus) {
        String status = requestedStatus == null ? "" : requestedStatus.trim().toUpperCase(Locale.ROOT);
        if (!List.of("ACTIVE", "INACTIVE", "PENDING").contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trạng thái sản phẩm không hợp lệ.");
        }
        int changed = jdbcTemplate.update("UPDATE products SET status = ? WHERE id = ?", status, productId);
        if (changed == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy sản phẩm.");
    }

    @Transactional
    public void updateProduct(long productId, UpdateProductRequest request) {
        Integer exists=jdbcTemplate.queryForObject("SELECT COUNT(*) FROM products WHERE id=?",Integer.class,productId);
        if(exists==null||exists==0) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Không tìm thấy sản phẩm.");
        Long categoryId=jdbcTemplate.query("SELECT id FROM categories WHERE lower(name)=lower(?) ORDER BY id LIMIT 1",
                (rs,n)->rs.getLong(1),request.categoryName().trim()).stream().findFirst()
                .orElseThrow(()->new ResponseStatusException(HttpStatus.BAD_REQUEST,"Danh mục sản phẩm không tồn tại."));
        Long brandId=null;
        if(request.brandName()!=null&&!request.brandName().isBlank()) {
            brandId=jdbcTemplate.query("SELECT id FROM brands WHERE lower(name)=lower(?) ORDER BY id LIMIT 1",
                    (rs,n)->rs.getLong(1),request.brandName().trim()).stream().findFirst()
                    .orElseGet(()->jdbcTemplate.queryForObject("INSERT INTO brands(name) VALUES(?) RETURNING id",Long.class,request.brandName().trim()));
        }
        if(request.imageKey()!=null&&request.imageKey().length()>7_000_000)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Ảnh sản phẩm quá lớn.");
        jdbcTemplate.update("""
                UPDATE products SET name=?,category_id=?,brand_id=?,description=?,daily_price=?,deposit_amount=?,stock=?,status=? WHERE id=?
                """,request.name().trim(),categoryId,brandId,request.description()==null?"":request.description().trim(),
                request.dailyPrice(),request.depositAmount(),request.stock(),request.status().trim().toUpperCase(Locale.ROOT),productId);
        if(request.imageKey()!=null&&!request.imageKey().isBlank()) {
            int changed=jdbcTemplate.update("""
                    UPDATE product_images SET image_url=?,is_primary=TRUE WHERE id=(
                      SELECT id FROM product_images WHERE product_id=? ORDER BY is_primary DESC NULLS LAST,id LIMIT 1)
                    """,request.imageKey().trim(),productId);
            if(changed==0) jdbcTemplate.update("INSERT INTO product_images(product_id,image_url,is_primary) VALUES(?,?,TRUE)",productId,request.imageKey().trim());
        }
    }

    @Transactional(readOnly = true)
    public RevenueTrendResponse getRevenueTrend(LocalDate from,LocalDate to) {
        if(from==null||to==null||to.isBefore(from)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Khoảng ngày thống kê không hợp lệ.");
        if(ChronoUnit.DAYS.between(from,to)>365) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Khoảng ngày tối đa là 366 ngày.");
        List<DailyRevenue> daily=jdbcTemplate.query("""
                WITH dates AS (SELECT generate_series(CAST(? AS date),CAST(? AS date),interval '1 day')::date d),
                paid AS (SELECT paid_at::date d,SUM(amount) amount FROM payments
                         WHERE UPPER(COALESCE(status,'')) IN ('PAID','SUCCESS','COMPLETED')
                           AND paid_at>=CAST(? AS date) AND paid_at<CAST(? AS date)+interval '1 day' GROUP BY paid_at::date),
                completed AS (SELECT created_at::date d,COUNT(*) amount FROM rentals
                         WHERE UPPER(COALESCE(status,'')) IN ('COMPLETED','COMPLETE','RETURNED','CLOSED')
                           AND created_at>=CAST(? AS date) AND created_at<CAST(? AS date)+interval '1 day' GROUP BY created_at::date)
                SELECT dates.d,COALESCE(paid.amount,0) amount,COALESCE(completed.amount,0) rentals
                FROM dates LEFT JOIN paid USING(d) LEFT JOIN completed USING(d) ORDER BY dates.d
                """,(rs,n)->new DailyRevenue(rs.getObject("d",LocalDate.class),rs.getBigDecimal("amount"),rs.getLong("rentals")),from,to,from,to,from,to);
        BigDecimal total=daily.stream().map(DailyRevenue::amount).reduce(BigDecimal.ZERO,BigDecimal::add);
        long completed=daily.stream().mapToLong(DailyRevenue::completedRentals).sum();
        List<AdminDtos.CategoryRevenue> categories=jdbcTemplate.query("""
                WITH paid AS (SELECT DISTINCT rental_id FROM payments WHERE UPPER(COALESCE(status,'')) IN ('PAID','SUCCESS','COMPLETED')
                              AND paid_at>=CAST(? AS date) AND paid_at<CAST(? AS date)+interval '1 day'),
                totals AS (SELECT COALESCE(c.name,'Khác') name,SUM(ri.subtotal) amount
                           FROM paid JOIN rental_items ri ON ri.rental_id=paid.rental_id AND UPPER(COALESCE(ri.status,''))<>'CANCELLED'
                           JOIN products p ON p.id=ri.product_id LEFT JOIN categories c ON c.id=p.category_id GROUP BY 1)
                SELECT name,amount,CASE WHEN SUM(amount) OVER()=0 THEN 0 ELSE ROUND(amount*100.0/SUM(amount) OVER(),2) END percentage
                FROM totals ORDER BY amount DESC
                """,(rs,n)->new AdminDtos.CategoryRevenue(rs.getString("name"),rs.getBigDecimal("amount"),rs.getDouble("percentage")),from,to);
        return new RevenueTrendResponse(from,to,total,completed,daily,categories);
    }

    @Transactional(readOnly = true)
    public PageResponse<RentalAdminResponse> getOrders(String search, String requestedStatus, int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        String normalizedSearch = search == null ? "" : search.trim().toLowerCase(Locale.ROOT);
        String status = normalizeOrderStatusFilter(requestedStatus);
        String from = """
                FROM rentals r
                JOIN users renter ON renter.id = r.renter_id
                LEFT JOIN rental_items ri ON ri.rental_id = r.id
                LEFT JOIN products p ON p.id = ri.product_id
                LEFT JOIN LATERAL (
                    SELECT method, status FROM payments WHERE rental_id = r.id ORDER BY id DESC LIMIT 1
                ) payment ON TRUE
                """;
        StringBuilder where = new StringBuilder(" WHERE TRUE");
        List<Object> args = new ArrayList<>();
        if (!normalizedSearch.isBlank()) {
            where.append(" AND LOWER(CONCAT_WS(' ', r.id::text, r.rental_code, renter.full_name, renter.email, r.contact_phone, p.name)) LIKE ?");
            args.add("%" + normalizedSearch + "%");
        }
        if (status != null) {
            if ("ACTIVE".equals(status)) {
                where.append(" AND UPPER(COALESCE(r.status, '')) IN ('ACTIVE', 'IN_PROGRESS', 'RENTING')");
            } else if ("COMPLETED".equals(status)) {
                where.append(" AND UPPER(COALESCE(r.status, '')) IN ('COMPLETED', 'COMPLETE', 'RETURNED', 'CLOSED')");
            } else if ("CANCELLED".equals(status)) {
                where.append(" AND UPPER(COALESCE(r.status, '')) IN ('CANCELLED', 'CANCELED')");
            } else {
                where.append(" AND UPPER(COALESCE(r.status, '')) = ?");
                args.add(status);
            }
        }
        Long total = jdbcTemplate.queryForObject("SELECT COUNT(DISTINCT r.id) " + from + where, Long.class, args.toArray());
        List<Object> queryArgs = new ArrayList<>(args);
        queryArgs.add(safeSize);
        queryArgs.add((long) safePage * safeSize);
        List<RentalAdminResponse> orders = jdbcTemplate.query("""
                SELECT r.id, r.rental_code, renter.full_name AS renter_name, renter.email AS renter_email,
                       r.contact_phone, r.status, COALESCE(payment.status, 'UNPAID') AS payment_status,
                       r.delivery_method, COUNT(ri.id)::integer AS item_count,
                       COALESCE(STRING_AGG(p.name || ' × ' || ri.quantity, ', ' ORDER BY ri.id), '') AS product_summary,
                       r.total_amount, r.created_at
                """ + from + where + " GROUP BY r.id, renter.full_name, renter.email, payment.status " +
                " ORDER BY r.created_at DESC NULLS LAST, r.id DESC LIMIT ? OFFSET ?",
                (rs, rowNum) -> new RentalAdminResponse(
                        rs.getLong("id"), rs.getString("rental_code"), rs.getString("renter_name"),
                        rs.getString("renter_email"), rs.getString("contact_phone"), rs.getString("status"),
                        rs.getString("payment_status"), rs.getString("delivery_method"), rs.getInt("item_count"),
                        rs.getString("product_summary"), rs.getBigDecimal("total_amount"),
                        rs.getTimestamp("created_at") == null ? null : rs.getTimestamp("created_at").toLocalDateTime()),
                queryArgs.toArray());
        long totalElements = total == null ? 0 : total;
        return new PageResponse<>(orders, safePage, safeSize, totalElements,
                (int) Math.ceil((double) totalElements / safeSize));
    }

    @Transactional(readOnly = true)
    public RentalAdminDetail getOrder(long rentalId) {
        List<RentalAdminDetail> orders = jdbcTemplate.query("""
                SELECT r.id, r.rental_code, renter.full_name AS renter_name, renter.email AS renter_email,
                       r.status, COALESCE(payment.status, 'UNPAID') AS payment_status, payment.method AS payment_method,
                       r.delivery_method, r.delivery_address, r.district, r.city, r.contact_name,
                       r.contact_phone, r.contact_email, COALESCE(r.total_amount, 0) AS total_amount,
                       COALESCE((SELECT SUM(ri.subtotal) FROM rental_items ri WHERE ri.rental_id = r.id),
                                GREATEST(COALESCE(r.total_amount, 0) - COALESCE(r.deposit_amount, 0) - COALESCE(r.service_fee, 0) - COALESCE(r.delivery_fee, 0), 0)) AS rental_amount,
                       COALESCE(r.deposit_amount, 0) AS deposit_amount, COALESCE(r.service_fee, 0) AS service_fee,
                       r.created_at
                FROM rentals r
                JOIN users renter ON renter.id = r.renter_id
                LEFT JOIN LATERAL (
                    SELECT method, status FROM payments WHERE rental_id = r.id ORDER BY id DESC LIMIT 1
                ) payment ON TRUE
                WHERE r.id = ?
                """, (rs, rowNum) -> new RentalAdminDetail(
                rs.getLong("id"), rs.getString("rental_code"), rs.getString("renter_name"),
                rs.getString("renter_email"), rs.getString("status"), rs.getString("payment_status"),
                rs.getString("payment_method"), rs.getString("delivery_method"), rs.getString("delivery_address"),
                rs.getString("district"), rs.getString("city"), rs.getString("contact_name"),
                rs.getString("contact_phone"), rs.getString("contact_email"), rs.getBigDecimal("total_amount"),
                rs.getBigDecimal("rental_amount"), rs.getBigDecimal("deposit_amount"), rs.getBigDecimal("service_fee"),
                rs.getTimestamp("created_at") == null ? null : rs.getTimestamp("created_at").toLocalDateTime(),
                List.of()), rentalId);
        if (orders.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn thuê.");
        RentalAdminDetail order = orders.get(0);
        List<RentalLineAdmin> items = jdbcTemplate.query("""
                SELECT p.id AS product_id, p.name AS product_name, owner.full_name AS owner_name,
                       ri.quantity, ri.start_date, ri.end_date, ri.daily_price, ri.subtotal, ri.status
                FROM rental_items ri
                JOIN products p ON p.id = ri.product_id
                JOIN users owner ON owner.id = p.owner_id
                WHERE ri.rental_id = ?
                ORDER BY ri.id
                """, (rs, rowNum) -> new RentalLineAdmin(
                rs.getLong("product_id"), rs.getString("product_name"), rs.getString("owner_name"),
                rs.getInt("quantity"), rs.getObject("start_date", java.time.LocalDate.class),
                rs.getObject("end_date", java.time.LocalDate.class), rs.getBigDecimal("daily_price"),
                rs.getBigDecimal("subtotal"), rs.getString("status")), rentalId);
        return new RentalAdminDetail(order.id(), order.rentalCode(), order.renterName(), order.renterEmail(),
                order.status(), order.paymentStatus(), order.paymentMethod(), order.deliveryMethod(),
                order.deliveryAddress(), order.district(), order.city(), order.contactName(), order.contactPhone(),
                order.contactEmail(), order.totalAmount(), order.rentalAmount(), order.depositAmount(),
                order.serviceFee(), order.createdAt(), items);
    }

    @Transactional
    public void cancelPendingOrder(long rentalId) {
        List<String> statuses = jdbcTemplate.query("SELECT status FROM rentals WHERE id = ? FOR UPDATE",
                (rs, rowNum) -> rs.getString("status"), rentalId);
        if (statuses.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn thuê.");
        if (!"PENDING".equalsIgnoreCase(statuses.get(0))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Chỉ có thể hủy đơn đang chờ xác nhận.");
        }
        jdbcTemplate.query("SELECT id FROM rental_items WHERE rental_id = ? ORDER BY id FOR UPDATE",
                (rs, rowNum) -> rs.getLong("id"), rentalId);
        Integer progressedItems = jdbcTemplate.queryForObject("""
                SELECT COUNT(*) FROM rental_items
                WHERE rental_id = ? AND UPPER(COALESCE(status, '')) <> 'PENDING'
                """, Integer.class, rentalId);
        if (progressedItems != null && progressedItems > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Đơn đã có thiết bị được xử lý. Vui lòng để Owner hoàn tất quy trình hiện tại.");
        }
        Integer itemCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM rental_items WHERE rental_id = ?",
                Integer.class, rentalId);
        if (itemCount == null || itemCount == 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Đơn thuê chưa có thiết bị để hoàn kho.");
        }
        jdbcTemplate.update("""
                UPDATE products p SET stock = COALESCE(p.stock, 0) + rental_items.quantity
                FROM (
                    SELECT product_id, SUM(quantity)::integer AS quantity
                    FROM rental_items WHERE rental_id = ? GROUP BY product_id
                ) rental_items
                WHERE p.id = rental_items.product_id
                """, rentalId);
        jdbcTemplate.update("UPDATE rental_items SET status = 'CANCELLED' WHERE rental_id = ?", rentalId);
        jdbcTemplate.update("UPDATE rentals SET status = 'CANCELLED' WHERE id = ?", rentalId);
        walletService.refundCancelledRental(rentalId);
        jdbcTemplate.update("""
                UPDATE payments SET status = 'REFUNDED'
                WHERE rental_id = ? AND UPPER(COALESCE(status, '')) IN ('PAID', 'SUCCESS', 'COMPLETED')
                """, rentalId);
    }

    private List<MonthlyRevenue> getMonthlyRevenue() {
        String sql = """
                WITH months AS (
                    SELECT generate_series(
                        date_trunc('month', CURRENT_DATE) - interval '11 months',
                        date_trunc('month', CURRENT_DATE), interval '1 month'
                    ) AS month_bucket
                ), payments_by_month AS (
                    SELECT date_trunc('month', paid_at) AS month_bucket, SUM(amount) AS amount
                    FROM payments
                    WHERE UPPER(COALESCE(status, '')) IN (%s)
                      AND paid_at >= date_trunc('month', CURRENT_DATE) - interval '11 months'
                      AND paid_at < date_trunc('month', CURRENT_DATE) + interval '1 month'
                    GROUP BY date_trunc('month', paid_at)
                ), rentals_by_month AS (
                    SELECT date_trunc('month', created_at) AS month_bucket, COUNT(*) AS rental_count
                    FROM rentals
                    WHERE UPPER(COALESCE(status, '')) IN (%s)
                      AND created_at >= date_trunc('month', CURRENT_DATE) - interval '11 months'
                      AND created_at < date_trunc('month', CURRENT_DATE) + interval '1 month'
                    GROUP BY date_trunc('month', created_at)
                )
                SELECT to_char(months.month_bucket, 'MM/YY') AS month,
                       COALESCE(payments_by_month.amount, 0) AS amount,
                       COALESCE(rentals_by_month.rental_count, 0) AS rental_count
                FROM months
                LEFT JOIN payments_by_month USING (month_bucket)
                LEFT JOIN rentals_by_month USING (month_bucket)
                ORDER BY months.month_bucket
                """.formatted(PAID_STATUSES, COMPLETED_RENTAL_STATUSES);

        return jdbcTemplate.query(sql, (rs, rowNum) -> new MonthlyRevenue(
                rs.getString("month"), rs.getBigDecimal("amount"), rs.getLong("rental_count")));
    }

    private List<CategoryRevenue> getRevenueByCategory() {
        String sql = """
                WITH paid_rentals AS (
                    SELECT DISTINCT rental_id
                    FROM payments
                    WHERE UPPER(COALESCE(status, '')) IN (%s)
                      AND paid_at >= date_trunc('month', CURRENT_TIMESTAMP)
                      AND paid_at < date_trunc('month', CURRENT_TIMESTAMP) + interval '1 month'
                ), category_totals AS (
                    SELECT COALESCE(categories.name, 'Khác') AS category_name,
                           COALESCE(SUM(rental_items.subtotal), 0) AS amount
                    FROM paid_rentals
                    JOIN rental_items ON rental_items.rental_id = paid_rentals.rental_id
                        AND UPPER(COALESCE(rental_items.status,'')) <> 'CANCELLED'
                    JOIN products ON products.id = rental_items.product_id
                    LEFT JOIN categories ON categories.id = products.category_id
                    GROUP BY COALESCE(categories.name, 'Khác')
                )
                SELECT category_name, amount,
                       CASE WHEN SUM(amount) OVER () = 0 THEN 0
                            ELSE ROUND(amount * 100.0 / SUM(amount) OVER (), 2) END AS percentage
                FROM category_totals
                ORDER BY amount DESC
                """.formatted(PAID_STATUSES);
        return jdbcTemplate.query(sql, (rs, rowNum) -> new CategoryRevenue(
                rs.getString("category_name"), rs.getBigDecimal("amount"), rs.getDouble("percentage")));
    }

    private List<RecentActivity> getRecentActivities() {
        String sql = """
                SELECT description, occurred_at FROM (
                    SELECT 'Người dùng mới đăng ký: ' || COALESCE(full_name, email) AS description,
                           created_at AS occurred_at
                    FROM users WHERE created_at IS NOT NULL
                    UNION ALL
                    SELECT 'Đơn thuê mới: ' || COALESCE(rental_code, '#' || id::text) AS description,
                           created_at AS occurred_at
                    FROM rentals WHERE created_at IS NOT NULL
                    UNION ALL
                    SELECT 'Thiết bị mới: ' || COALESCE(name, 'Chưa đặt tên') AS description,
                           created_at AS occurred_at
                    FROM products WHERE created_at IS NOT NULL
                    UNION ALL
                    SELECT 'Báo cáo mới: ' || COALESCE(category, 'Cần xem xét') AS description,
                           created_at AS occurred_at
                    FROM marketplace_reports WHERE created_at IS NOT NULL
                    UNION ALL
                    SELECT 'Tranh chấp tiền cọc mới: ' || COALESCE(reason, 'Cần xem xét') AS description,
                           created_at AS occurred_at
                    FROM rental_disputes WHERE created_at IS NOT NULL
                ) activity
                ORDER BY occurred_at DESC
                LIMIT 6
                """;
        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            Timestamp timestamp = rs.getTimestamp("occurred_at");
            return new RecentActivity("ACTIVITY", rs.getString("description"),
                    timestamp == null ? null : timestamp.toLocalDateTime());
        });
    }

    private long countRentals(Long userId) {
        Long count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM rentals WHERE renter_id = ?", Long.class, userId);
        return count == null ? 0 : count;
    }

    private UserResponse toUserResponse(User user, long rentalCount) {
        String status = "ACTIVE".equalsIgnoreCase(user.getStatus()) ? "ACTIVE" : "LOCKED";
        return new UserResponse(user.getId(), user.getFullName(), user.getEmail(), user.getPhone(),
                user.getRole(), status, user.getCreatedAt(), rentalCount);
    }

    private String normalizeRole(String role) {
        if (role == null || role.isBlank() || "ALL".equalsIgnoreCase(role)) return null;
        String normalized = role.trim().toUpperCase(Locale.ROOT);
        if (!List.of("ADMIN", "USER").contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vai trò không hợp lệ.");
        }
        return normalized;
    }

    private Long parseIdSearch(String search) {
        if (search == null) return null;
        String value = search.toUpperCase(Locale.ROOT).startsWith("USR-") ? search.substring(4) : search;
        if (!value.matches("\\d+")) return null;
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private String normalizeStatusFilter(String status) {
        if (status == null || status.isBlank() || "ALL".equalsIgnoreCase(status)) return null;
        String normalized = status.trim().toUpperCase(Locale.ROOT);
        if ("ACTIVE".equals(normalized)) return normalized;
        if ("LOCKED".equals(normalized) || "BLOCKED".equals(normalized)) return "LOCKED";
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trạng thái lọc không hợp lệ.");
    }

    private String normalizeProductStatusFilter(String status) {
        if (status == null || status.isBlank() || "ALL".equalsIgnoreCase(status)) return null;
        String normalized = status.trim().toUpperCase(Locale.ROOT);
        if (List.of("ACTIVE", "INACTIVE", "PENDING", "PENDING_APPROVAL", "WAITING_APPROVAL", "REJECTED", "SUSPENDED", "RENTED").contains(normalized)) {
            return normalized;
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trạng thái lọc sản phẩm không hợp lệ.");
    }

    private String normalizeOrderStatusFilter(String status) {
        if (status == null || status.isBlank() || "ALL".equalsIgnoreCase(status)) return null;
        String normalized = status.trim().toUpperCase(Locale.ROOT);
        if (List.of("PENDING", "CONFIRMED", "ACTIVE", "COMPLETED", "CANCELLED", "REJECTED").contains(normalized)) {
            return normalized;
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trạng thái đơn thuê không hợp lệ.");
    }

    private long scalarLong(String sql) {
        Long value = jdbcTemplate.queryForObject(sql, Long.class);
        return value == null ? 0 : value;
    }

    private BigDecimal scalarMoney(String sql) {
        BigDecimal value = jdbcTemplate.queryForObject(sql, BigDecimal.class);
        return value == null ? BigDecimal.ZERO : value;
    }
}
