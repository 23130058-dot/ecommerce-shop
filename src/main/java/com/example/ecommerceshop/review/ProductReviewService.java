package com.example.ecommerceshop.review;

import com.example.ecommerceshop.review.ProductReviewDtos.CreateReviewRequest;
import com.example.ecommerceshop.review.ProductReviewDtos.ReviewResponse;
import com.example.ecommerceshop.review.ProductReviewDtos.ReviewsResponse;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ProductReviewService {
    private static final int MAX_PAGE_SIZE = 30;
    private final JdbcTemplate jdbc;

    public ProductReviewService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional(readOnly = true)
    public ReviewsResponse getReviews(long productId, Long userId, int requestedPage, int requestedSize) {
        requireActiveProduct(productId);
        int page = Math.max(requestedPage, 0);
        int size = Math.min(Math.max(requestedSize, 1), MAX_PAGE_SIZE);

        ReviewSummary summary = jdbc.queryForObject("""
                SELECT COUNT(*) AS review_count, COALESCE(AVG(rating), 0) AS average_rating
                FROM product_reviews
                WHERE product_id = ?
                """, (rs, row) -> new ReviewSummary(rs.getLong("review_count"), rs.getBigDecimal("average_rating")), productId);
        long count = summary == null ? 0 : summary.count();
        BigDecimal average = summary == null ? BigDecimal.ZERO : summary.average().setScale(1, RoundingMode.HALF_UP);

        Map<Integer, Long> distribution = new LinkedHashMap<>();
        for (int rating = 5; rating >= 1; rating--) distribution.put(rating, 0L);
        jdbc.query("SELECT rating, COUNT(*) AS amount FROM product_reviews WHERE product_id = ? GROUP BY rating",
                rs -> { distribution.put(rs.getInt("rating"), rs.getLong("amount")); }, productId);

        boolean hasReviewed = userId != null && exists(
                "SELECT EXISTS(SELECT 1 FROM product_reviews WHERE product_id = ? AND user_id = ?)", productId, userId);
        boolean isOwner = userId != null && exists(
                "SELECT EXISTS(SELECT 1 FROM products WHERE id = ? AND owner_id = ?)", productId, userId);
        boolean canReview = userId != null && !hasReviewed && !isOwner && isCompletedRenter(userId, productId);
        long offset = (long) page * size;
        List<ReviewResponse> reviews = jdbc.query("""
                SELECT pr.id, COALESCE(NULLIF(u.full_name, ''), 'Người dùng LensRent') AS reviewer_name,
                       u.avatar_url, pr.rating, pr.comment, pr.created_at, pr.is_sample
                FROM product_reviews pr
                JOIN users u ON u.id = pr.user_id
                WHERE pr.product_id = ?
                ORDER BY pr.created_at DESC, pr.id DESC
                LIMIT ? OFFSET ?
                """, this::mapReview, productId, size, offset);

        int totalPages = count == 0 ? 0 : (int) Math.ceil((double) count / size);
        return new ReviewsResponse(average, count, distribution, canReview, hasReviewed, reviews, page, size, totalPages);
    }

    @Transactional
    public void createReview(long userId, long productId, CreateReviewRequest request) {
        requireActiveProduct(productId);
        if (exists("SELECT EXISTS(SELECT 1 FROM products WHERE id = ? AND owner_id = ?)", productId, userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không thể đánh giá thiết bị do chính mình đăng.");
        }
        if (!isCompletedRenter(userId, productId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Chỉ người thuê đã hoàn tất đơn của thiết bị này mới có thể gửi đánh giá.");
        }

        int inserted = jdbc.update("""
                INSERT INTO product_reviews (product_id, user_id, rating, comment)
                VALUES (?, ?, ?, ?)
                ON CONFLICT (product_id, user_id) DO NOTHING
                """, productId, userId, request.rating(), request.comment().trim());
        if (inserted == 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bạn đã đánh giá thiết bị này rồi.");
        }

        jdbc.update("""
                UPDATE products p
                SET rating = (SELECT ROUND(AVG(pr.rating)::numeric, 1)
                              FROM product_reviews pr WHERE pr.product_id = p.id)
                WHERE p.id = ?
                """, productId);
    }

    private void requireActiveProduct(long productId) {
        if (!exists("SELECT EXISTS(SELECT 1 FROM products WHERE id = ? AND status = 'ACTIVE')", productId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy thiết bị này.");
        }
    }

    private boolean isCompletedRenter(long userId, long productId) {
        return exists("""
                SELECT EXISTS(
                    SELECT 1
                    FROM rentals r
                    JOIN rental_items ri ON ri.rental_id = r.id
                    WHERE r.renter_id = ?
                      AND ri.product_id = ?
                      AND UPPER(COALESCE(ri.status, r.status, '')) IN ('COMPLETED', 'COMPLETE', 'RETURNED', 'CLOSED')
                )
                """, userId, productId);
    }

    private boolean exists(String sql, Object... args) {
        Boolean result = jdbc.queryForObject(sql, Boolean.class, args);
        return Boolean.TRUE.equals(result);
    }

    private ReviewResponse mapReview(ResultSet rs, int row) throws SQLException {
        return new ReviewResponse(rs.getLong("id"), rs.getString("reviewer_name"), rs.getString("avatar_url"),
                rs.getInt("rating"), rs.getString("comment"), rs.getTimestamp("created_at").toLocalDateTime(),
                !rs.getBoolean("is_sample"), rs.getBoolean("is_sample"));
    }

    private record ReviewSummary(long count, BigDecimal average) {
    }
}
