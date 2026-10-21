package com.example.ecommerceshop.owner;

import com.example.ecommerceshop.user.User;
import com.example.ecommerceshop.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.LocalDate;
import java.time.Year;
import java.util.*;
import java.math.BigDecimal;

import com.example.ecommerceshop.owner.OwnerDtos.RentalResponse;
import com.example.ecommerceshop.owner.OwnerDtos.MonthlyRevenue;
import com.example.ecommerceshop.owner.OwnerDtos.RevenueResponse;

import com.example.ecommerceshop.owner.OwnerDtos.ProductResponse;

import com.example.ecommerceshop.owner.OwnerDtos.CreateProductRequest;
import com.example.ecommerceshop.owner.OwnerDtos.UpdateProductRequest;
import com.example.ecommerceshop.owner.OwnerDtos.ProfileResponse;
import com.example.ecommerceshop.owner.OwnerDtos.UpdateProfileRequest;

@Service
public class OwnerService {

    private final JdbcTemplate jdbcTemplate;
    private final UserRepository userRepository;

    public OwnerService(
            JdbcTemplate jdbcTemplate,
            UserRepository userRepository
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.userRepository = userRepository;
    }

    private User getCurrentOwner(Jwt jwt) {
        if (jwt == null || jwt.getSubject() == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Vui lòng đăng nhập."
            );
        }

        User user = userRepository.findByEmail(jwt.getSubject())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Không tìm thấy tài khoản đăng nhập."
                ));

        if (!"OWNER".equalsIgnoreCase(user.getRole())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Bạn không có quyền sử dụng chức năng Owner."
            );
        }

        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Tài khoản của bạn không hoạt động."
            );
        }

        return user;
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getProducts(Jwt jwt) {
        User owner = getCurrentOwner(jwt);

        String sql = """
            SELECT p.id,
                   p.name,
                   p.item_type,
                   c.slug AS category,
                   c.name AS category_name,
                   b.name AS brand,
                   p.description,
                   p.daily_price,
                   p.deposit_amount,
                   p.stock,
                   p.status,
                   p.tags,
                   COALESCE(image.image_url, '') AS image_key
            FROM products p
            LEFT JOIN categories c ON c.id = p.category_id
            LEFT JOIN brands b ON b.id = p.brand_id
            LEFT JOIN LATERAL (
                SELECT pi.image_url
                FROM product_images pi
                WHERE pi.product_id = p.id
                ORDER BY pi.is_primary DESC NULLS LAST, pi.id
                LIMIT 1
            ) image ON TRUE
            WHERE p.owner_id = ?
            ORDER BY p.created_at DESC NULLS LAST, p.id DESC
            """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            String rawTags = rs.getString("tags");

            List<String> tags = rawTags == null || rawTags.isBlank()
                    ? List.of()
                    : Arrays.stream(rawTags.split("\\|"))
                    .map(String::trim)
                    .filter(tag -> !tag.isEmpty())
                    .toList();

            int stock = Math.max(0, rs.getInt("stock"));

            return new ProductResponse(
                    rs.getLong("id"),
                    rs.getString("name"),
                    rs.getString("item_type"),
                    rs.getString("category"),
                    rs.getString("category_name"),
                    rs.getString("brand"),
                    rs.getString("description"),
                    rs.getBigDecimal("daily_price"),
                    rs.getBigDecimal("deposit_amount"),
                    stock,
                    stock,
                    rs.getString("status"),
                    rs.getString("image_key"),
                    List.of(),
                    tags
            );
        }, owner.getId());
    }

    @Transactional(readOnly = true)
    public ProductResponse getProductById(Jwt jwt, Long productId) {
        return getProducts(jwt).stream()
                .filter(product -> Objects.equals(product.id(), productId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy thiết bị hoặc bạn không có quyền xem thiết bị này."
                ));
    }

    @Transactional
    public ProductResponse createProduct(Jwt jwt, CreateProductRequest request) {
        User owner = getCurrentOwner(jwt);
        validateProduct(
                request.name(),
                request.dailyPrice(),
                request.depositAmount(),
                request.quantity(),
                request.category()
        );

        long categoryId = findCategoryId(request.category());
        long brandId = findOrCreateBrand(request.brand());

        String status = normalizeStatus(request.status());
        String tags = request.tags() == null
                ? ""
                : request.tags().stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(tag -> !tag.isBlank())
                .distinct()
                .collect(java.util.stream.Collectors.joining("|"));

        Long productId = jdbcTemplate.queryForObject("""
        INSERT INTO products (
            owner_id, category_id, brand_id, name, description,
            daily_price, deposit_amount, stock, status, item_type, tags
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING id
        """,
                Long.class,
                owner.getId(),
                categoryId,
                brandId,
                request.name().trim(),
                request.description(),
                request.dailyPrice(),
                request.depositAmount(),
                request.quantity(),
                status,
                request.type(),
                tags
        );

        saveProductImage(productId, request.imageUrl());

        return getProductById(jwt, productId);
    }

    @Transactional
    public ProductResponse updateProduct(
            Jwt jwt,
            Long productId,
            UpdateProductRequest request
    ) {
        User owner = getCurrentOwner(jwt);
        validateProduct(
                request.name(),
                request.dailyPrice(),
                request.depositAmount(),
                request.quantity(),
                request.category()
        );

        // Chỉ cho phép sửa thiết bị thuộc về Owner đang đăng nhập.
        Integer count = jdbcTemplate.queryForObject("""
        SELECT COUNT(*)
        FROM products
        WHERE id = ? AND owner_id = ?
        """,
                Integer.class,
                productId,
                owner.getId()
        );

        if (count == null || count == 0) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Không tìm thấy thiết bị hoặc bạn không có quyền sửa thiết bị này."
            );
        }

        long categoryId = findCategoryId(request.category());
        long brandId = findOrCreateBrand(request.brand());

        String tags = request.tags() == null
                ? ""
                : request.tags().stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(tag -> !tag.isBlank())
                .distinct()
                .collect(java.util.stream.Collectors.joining("|"));

        jdbcTemplate.update("""
        UPDATE products
        SET category_id = ?,
            brand_id = ?,
            name = ?,
            description = ?,
            daily_price = ?,
            deposit_amount = ?,
            stock = ?,
            status = ?,
            item_type = ?,
            tags = ?
        WHERE id = ? AND owner_id = ?
        """,
                categoryId,
                brandId,
                request.name().trim(),
                request.description(),
                request.dailyPrice(),
                request.depositAmount(),
                request.quantity(),
                normalizeStatus(request.status()),
                request.type(),
                tags,
                productId,
                owner.getId()
        );

        saveProductImage(productId, request.imageUrl());

        return getProductById(jwt, productId);
    }

    private void validateProduct(
            String name,
            BigDecimal dailyPrice,
            BigDecimal depositAmount,
            Integer quantity,
            String category
    ) {
        if (name == null || name.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Tên thiết bị không được để trống."
            );
        }

        if (category == null || category.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Vui lòng chọn danh mục."
            );
        }

        if (dailyPrice == null || dailyPrice.signum() < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Giá thuê mỗi ngày không hợp lệ."
            );
        }

        if (depositAmount == null || depositAmount.signum() < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Tiền đặt cọc không hợp lệ."
            );
        }

        if (quantity == null || quantity < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Số lượng thiết bị không hợp lệ."
            );
        }
    }

    private long findCategoryId(String category) {
        List<Long> ids = jdbcTemplate.query("""
        SELECT id
        FROM categories
        WHERE LOWER(slug) = LOWER(?)
           OR LOWER(name) = LOWER(?)
        ORDER BY CASE WHEN LOWER(slug) = LOWER(?) THEN 0 ELSE 1 END
        LIMIT 1
        """,
                (rs, rowNum) -> rs.getLong("id"),
                category.trim(),
                category.trim(),
                category.trim()
        );

        if (ids.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Danh mục không tồn tại: " + category
            );
        }

        return ids.get(0);
    }

    private long findOrCreateBrand(String brand) {
        if (brand == null || brand.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Vui lòng nhập thương hiệu."
            );
        }

        String normalizedBrand = brand.trim();

        List<Long> ids = jdbcTemplate.query("""
        SELECT id
        FROM brands
        WHERE LOWER(name) = LOWER(?)
        LIMIT 1
        """,
                (rs, rowNum) -> rs.getLong("id"),
                normalizedBrand
        );

        if (!ids.isEmpty()) {
            return ids.get(0);
        }

        return Objects.requireNonNull(
                jdbcTemplate.queryForObject("""
            INSERT INTO brands (name)
            VALUES (?)
            RETURNING id
            """,
                        Long.class,
                        normalizedBrand
                )
        );
    }

    private String normalizeStatus(String status) {
        String normalized = status == null || status.isBlank()
                ? "ACTIVE"
                : status.trim().toUpperCase(Locale.ROOT);

        if (!List.of("ACTIVE", "INACTIVE", "MAINTENANCE").contains(normalized)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Trạng thái thiết bị không hợp lệ."
            );
        }

        return normalized;
    }

    private void saveProductImage(Long productId, String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) {
            return;
        }

        Integer count = jdbcTemplate.queryForObject("""
        SELECT COUNT(*)
        FROM product_images
        WHERE product_id = ? AND is_primary = TRUE
        """,
                Integer.class,
                productId
        );

        if (count != null && count > 0) {
            jdbcTemplate.update("""
            UPDATE product_images
            SET image_url = ?
            WHERE product_id = ? AND is_primary = TRUE
            """,
                    imageUrl,
                    productId
            );
        } else {
            jdbcTemplate.update("""
            INSERT INTO product_images (product_id, image_url, is_primary)
            VALUES (?, ?, TRUE)
            """,
                    productId,
                    imageUrl
            );
        }
    }

    @Transactional(readOnly = true)
    public List<RentalResponse> getBookings(Jwt jwt) {
        User owner = getCurrentOwner(jwt);

        String sql = """
        SELECT
            r.id,
            r.rental_code,
            u.full_name AS renter_name,
            u.phone AS renter_phone,
            STRING_AGG(DISTINCT p.name, ' | ' ORDER BY p.name)
                AS product_names,
            MIN(ri.start_date) AS start_date,
            MAX(ri.end_date) AS end_date,
            COALESCE(SUM(ri.subtotal), 0) AS rental_amount,
            COALESCE(r.deposit_amount, 0) AS deposit_amount,
            r.status,
            COALESCE((
                SELECT STRING_AGG(DISTINCT UPPER(pay.status), ',')
                FROM payments pay
                WHERE pay.rental_id = r.id
            ), 'UNPAID') AS payment_status
        FROM rentals r
        JOIN users u ON u.id = r.renter_id
        JOIN rental_items ri ON ri.rental_id = r.id
        JOIN products p ON p.id = ri.product_id
        WHERE p.owner_id = ?
        GROUP BY
            r.id, r.rental_code, u.full_name, u.phone,
            r.deposit_amount, r.status, r.created_at
        ORDER BY r.created_at DESC NULLS LAST, r.id DESC
        """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            String names = rs.getString("product_names");

            List<String> productNames =
                    names == null || names.isBlank()
                            ? List.of()
                            : Arrays.stream(names.split(" \\| "))
                            .toList();

            java.sql.Date start = rs.getDate("start_date");
            java.sql.Date end = rs.getDate("end_date");

            return new RentalResponse(
                    rs.getLong("id"),
                    rs.getString("rental_code"),
                    rs.getString("renter_name"),
                    rs.getString("renter_phone"),
                    productNames,
                    start == null ? null : start.toLocalDate(),
                    end == null ? null : end.toLocalDate(),
                    rs.getBigDecimal("rental_amount"),
                    rs.getBigDecimal("deposit_amount"),
                    rs.getString("status"),
                    rs.getString("payment_status")
            );
        }, owner.getId());
    }


    @Transactional
    public RentalResponse confirmBooking(Jwt jwt, Long rentalId) {
        User owner = getCurrentOwner(jwt);

        List<String> statuses = jdbcTemplate.query("""
        SELECT DISTINCT UPPER(r.status)
        FROM rentals r
        WHERE r.id = ?
          AND EXISTS (
              SELECT 1
              FROM rental_items ri
              JOIN products p ON p.id = ri.product_id
              WHERE ri.rental_id = r.id
                AND p.owner_id = ?
          )
        """,
                (rs, rowNum) -> rs.getString(1),
                rentalId,
                owner.getId()
        );

        if (statuses.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Không tìm thấy đơn thuê thuộc thiết bị của bạn."
            );
        }

        if (!"PENDING".equals(statuses.get(0))) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Chỉ có thể xác nhận đơn đang chờ xử lý."
            );
        }

        jdbcTemplate.update("""
        UPDATE rentals
        SET status = 'CONFIRMED'
        WHERE id = ?
          AND UPPER(status) = 'PENDING'
          AND EXISTS (
              SELECT 1
              FROM rental_items ri
              JOIN products p ON p.id = ri.product_id
              WHERE ri.rental_id = rentals.id
                AND p.owner_id = ?
          )
        """,
                rentalId,
                owner.getId()
        );

        return getBookingById(owner.getId(), rentalId);
    }


    @Transactional
    public RentalResponse completeBooking(Jwt jwt, Long rentalId) {
        User owner = getCurrentOwner(jwt);

        List<String> statuses = jdbcTemplate.query("""
        SELECT DISTINCT UPPER(r.status)
        FROM rentals r
        WHERE r.id = ?
          AND EXISTS (
              SELECT 1
              FROM rental_items ri
              JOIN products p ON p.id = ri.product_id
              WHERE ri.rental_id = r.id
                AND p.owner_id = ?
          )
        """,
                (rs, rowNum) -> rs.getString(1),
                rentalId,
                owner.getId()
        );

        if (statuses.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Không tìm thấy đơn thuê thuộc thiết bị của bạn."
            );
        }

        String status = statuses.get(0);

        if (!List.of("CONFIRMED", "ACTIVE").contains(status)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Trạng thái đơn hiện tại không cho phép hoàn thành."
            );
        }

        jdbcTemplate.update("""
        UPDATE rentals
        SET status = 'COMPLETED'
        WHERE id = ?
          AND UPPER(status) IN ('CONFIRMED', 'ACTIVE')
          AND EXISTS (
              SELECT 1
              FROM rental_items ri
              JOIN products p ON p.id = ri.product_id
              WHERE ri.rental_id = rentals.id
                AND p.owner_id = ?
          )
        """,
                rentalId,
                owner.getId()
        );

        return getBookingById(owner.getId(), rentalId);
    }

    private RentalResponse getBookingById(Long ownerId, Long rentalId) {
        String sql = """
        SELECT
            r.id,
            r.rental_code,
            u.full_name AS renter_name,
            u.phone AS renter_phone,
            STRING_AGG(DISTINCT p.name, ' | ' ORDER BY p.name)
                AS product_names,
            MIN(ri.start_date) AS start_date,
            MAX(ri.end_date) AS end_date,
            COALESCE(SUM(ri.subtotal), 0) AS rental_amount,
            COALESCE(r.deposit_amount, 0) AS deposit_amount,
            r.status,
            COALESCE((
                SELECT STRING_AGG(DISTINCT UPPER(pay.status), ',')
                FROM payments pay
                WHERE pay.rental_id = r.id
            ), 'UNPAID') AS payment_status
        FROM rentals r
        JOIN users u ON u.id = r.renter_id
        JOIN rental_items ri ON ri.rental_id = r.id
        JOIN products p ON p.id = ri.product_id
        WHERE r.id = ?
          AND p.owner_id = ?
        GROUP BY
            r.id, r.rental_code, u.full_name, u.phone,
            r.deposit_amount, r.status, r.created_at
        """;

        List<RentalResponse> results = jdbcTemplate.query(
                sql,
                (rs, rowNum) -> {
                    String names = rs.getString("product_names");
                    List<String> productNames =
                            names == null || names.isBlank()
                                    ? List.of()
                                    : Arrays.stream(names.split(" \\| "))
                                    .toList();

                    java.sql.Date start = rs.getDate("start_date");
                    java.sql.Date end = rs.getDate("end_date");

                    return new RentalResponse(
                            rs.getLong("id"),
                            rs.getString("rental_code"),
                            rs.getString("renter_name"),
                            rs.getString("renter_phone"),
                            productNames,
                            start == null ? null : start.toLocalDate(),
                            end == null ? null : end.toLocalDate(),
                            rs.getBigDecimal("rental_amount"),
                            rs.getBigDecimal("deposit_amount"),
                            rs.getString("status"),
                            rs.getString("payment_status")
                    );
                },
                rentalId,
                ownerId
        );

        if (results.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Không tìm thấy đơn thuê."
            );
        }

        return results.get(0);
    }

    @Transactional(readOnly = true)
    public RevenueResponse getRevenue(Jwt jwt, Integer requestedYear) {
        User owner = getCurrentOwner(jwt);

        int year = requestedYear == null
                ? Year.now().getValue()
                : requestedYear;

        if (year < 2000 || year > 2100) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Năm thống kê không hợp lệ."
            );
        }

        String sql = """
        WITH paid_rentals AS (
            SELECT DISTINCT ON (pay.rental_id)
                pay.rental_id,
                DATE_TRUNC('month', pay.paid_at) AS revenue_month
            FROM payments pay
            WHERE UPPER(pay.status) = 'PAID'
              AND pay.paid_at >= ?
              AND pay.paid_at < ?
            ORDER BY pay.rental_id, pay.paid_at
        )
        SELECT
            EXTRACT(MONTH FROM pr.revenue_month)::INTEGER
                AS month_number,
            COALESCE(SUM(ri.subtotal), 0) AS revenue
        FROM paid_rentals pr
        JOIN rental_items ri ON ri.rental_id = pr.rental_id
        JOIN products p ON p.id = ri.product_id
        WHERE p.owner_id = ?
        GROUP BY EXTRACT(MONTH FROM pr.revenue_month)
        ORDER BY month_number
        """;

        Map<Integer, BigDecimal> revenueByMonth = new HashMap<>();

        jdbcTemplate.query(
                sql,
                rs -> {
                    revenueByMonth.put(
                            rs.getInt("month_number"),
                            rs.getBigDecimal("revenue")
                    );
                },
                java.sql.Timestamp.valueOf(
                        LocalDate.of(year, 1, 1).atStartOfDay()
                ),
                java.sql.Timestamp.valueOf(
                        LocalDate.of(year + 1, 1, 1).atStartOfDay()
                ),
                owner.getId()
        );

        List<MonthlyRevenue> monthlyRevenue = new ArrayList<>();
        BigDecimal totalRevenue = BigDecimal.ZERO;

        for (int month = 1; month <= 12; month++) {
            BigDecimal amount = revenueByMonth.getOrDefault(
                    month,
                    BigDecimal.ZERO
            );

            monthlyRevenue.add(
                    new MonthlyRevenue(
                            String.format("%02d", month),
                            amount
                    )
            );

            totalRevenue = totalRevenue.add(amount);
        }

        return new RevenueResponse(monthlyRevenue, totalRevenue);
    }

    @Transactional(readOnly = true)
    public ProfileResponse getProfile(Jwt jwt) {
        User owner = getCurrentOwner(jwt);

        String sql = """
        SELECT id, full_name, email, phone, address, district, city
        FROM users
        WHERE id = ?
        """;

        return jdbcTemplate.queryForObject(
                sql,
                (rs, rowNum) -> new ProfileResponse(
                        rs.getLong("id"),
                        rs.getString("full_name"),
                        rs.getString("email"),
                        rs.getString("phone"),
                        rs.getString("address"),
                        rs.getString("district"),
                        rs.getString("city")
                ),
                owner.getId()
        );
    }

    @Transactional
    public ProfileResponse updateProfile(
            Jwt jwt,
            UpdateProfileRequest request
    ) {
        User owner = getCurrentOwner(jwt);

        if (request == null
                || request.fullName() == null
                || request.fullName().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Họ và tên không được để trống."
            );
        }

        String fullName = request.fullName().trim();

        if (fullName.length() > 150) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Họ và tên không được vượt quá 150 ký tự."
            );
        }

        jdbcTemplate.update("""
        UPDATE users
        SET full_name = ?,
            phone = ?,
            address = ?,
            district = ?,
            city = ?
        WHERE id = ?
        """,
                fullName,
                normalizeOptionalText(request.phone()),
                normalizeOptionalText(request.address()),
                normalizeOptionalText(request.district()),
                normalizeOptionalText(request.city()),
                owner.getId()
        );

        return getProfile(jwt);
    }

    private String normalizeOptionalText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }

}
