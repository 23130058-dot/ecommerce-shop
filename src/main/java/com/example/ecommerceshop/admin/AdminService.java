package com.example.ecommerceshop.admin;

import com.example.ecommerceshop.admin.AdminDtos.CategoryRevenue;
import com.example.ecommerceshop.admin.AdminDtos.DashboardResponse;
import com.example.ecommerceshop.admin.AdminDtos.MonthlyRevenue;
import com.example.ecommerceshop.admin.AdminDtos.RecentActivity;
import com.example.ecommerceshop.admin.AdminDtos.UserPageResponse;
import com.example.ecommerceshop.admin.AdminDtos.UserResponse;
import com.example.ecommerceshop.admin.AdminDtos.UserSummary;
import com.example.ecommerceshop.user.User;
import com.example.ecommerceshop.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class AdminService {
    private static final int MAX_PAGE_SIZE = 100;
    private static final String PAID_STATUSES = "'PAID', 'SUCCESS', 'COMPLETED'";
    private static final String COMPLETED_RENTAL_STATUSES = "'COMPLETED', 'COMPLETE', 'RETURNED', 'CLOSED'";

    private final UserRepository userRepository;
    private final JdbcTemplate jdbcTemplate;

    public AdminService(UserRepository userRepository, JdbcTemplate jdbcTemplate) {
        this.userRepository = userRepository;
        this.jdbcTemplate = jdbcTemplate;
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
        long openDisputes = scalarLong("SELECT COUNT(*) FROM rentals WHERE UPPER(COALESCE(status, '')) IN ('DISPUTED', 'IN_DISPUTE', 'DISPUTE_OPEN')");
        BigDecimal revenueThisMonth = scalarMoney("""
                SELECT COALESCE(SUM(amount), 0) FROM payments
                WHERE UPPER(COALESCE(status, '')) IN (%s)
                  AND paid_at >= date_trunc('month', CURRENT_TIMESTAMP)
                  AND paid_at < date_trunc('month', CURRENT_TIMESTAMP) + interval '1 month'
                """.formatted(PAID_STATUSES));

        return new DashboardResponse(totalUsers, activeUsers, newUsersThisMonth, completedRentals,
                pendingDevices, openDisputes, revenueThisMonth, getMonthlyRevenue(),
                getRevenueByCategory(), getRecentActivities());
    }

    @Transactional(readOnly = true)
    public UserPageResponse getUsers(String search, String role, String status, int page, int size) {
        String normalizedSearch = search == null ? "" : search.trim();
        String searchPattern = normalizedSearch.isEmpty()
                ? "%%"
                : "%" + normalizedSearch.toLowerCase(Locale.ROOT) + "%";
        Long idSearch = parseIdSearch(normalizedSearch);
        String normalizedRole = normalizeRole(role);
        String normalizedStatus = normalizeStatusFilter(status);
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        Page<User> users = userRepository.searchUsers(searchPattern, idSearch, normalizedRole, normalizedStatus,
                PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt")));

        Map<Long, Long> rentalCounts = getRentalCounts(users.getContent());
        List<UserResponse> results = users.getContent().stream()
                .map(user -> toUserResponse(user, rentalCounts.getOrDefault(user.getId(), 0L)))
                .toList();
        long totalUsers = scalarLong("SELECT COUNT(*) FROM users");
        long activeUsers = scalarLong("SELECT COUNT(*) FROM users WHERE UPPER(COALESCE(status, '')) = 'ACTIVE'");
        long newUsers = scalarLong("""
                SELECT COUNT(*) FROM users
                WHERE created_at >= date_trunc('month', CURRENT_TIMESTAMP)
                  AND created_at < date_trunc('month', CURRENT_TIMESTAMP) + interval '1 month'
                """);
        UserSummary summary = new UserSummary(totalUsers, activeUsers, Math.max(0, totalUsers - activeUsers), newUsers);
        return new UserPageResponse(results, users.getNumber(), users.getSize(),
                users.getTotalElements(), users.getTotalPages(), summary);
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

    private Map<Long, Long> getRentalCounts(List<User> users) {
        if (users.isEmpty()) return Map.of();
        String placeholders = String.join(",", java.util.Collections.nCopies(users.size(), "?"));
        String sql = "SELECT renter_id, COUNT(*) AS rental_count FROM rentals WHERE renter_id IN (" + placeholders + ") GROUP BY renter_id";
        List<Object> ids = new ArrayList<>(users.stream().map(User::getId).toList());
        Map<Long, Long> counts = new HashMap<>();
        jdbcTemplate.query(sql, statement -> {
            for (int index = 0; index < ids.size(); index++) statement.setLong(index + 1, (Long) ids.get(index));
        }, resultSet -> {
            counts.put(resultSet.getLong("renter_id"), resultSet.getLong("rental_count"));
        });
        return counts;
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
        if (!List.of("ADMIN", "OWNER", "RENTER").contains(normalized)) {
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

    private long scalarLong(String sql) {
        Long value = jdbcTemplate.queryForObject(sql, Long.class);
        return value == null ? 0 : value;
    }

    private BigDecimal scalarMoney(String sql) {
        BigDecimal value = jdbcTemplate.queryForObject(sql, BigDecimal.class);
        return value == null ? BigDecimal.ZERO : value;
    }
}
