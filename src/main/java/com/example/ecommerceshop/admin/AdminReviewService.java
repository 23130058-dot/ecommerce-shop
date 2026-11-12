package com.example.ecommerceshop.admin;

import com.example.ecommerceshop.admin.AdminReviewDtos.ReviewPage;
import com.example.ecommerceshop.admin.AdminReviewDtos.ReviewResponse;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import com.example.ecommerceshop.review.SentimentClassifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class AdminReviewService {
    private final JdbcTemplate jdbc;
    private final SentimentClassifier sentimentClassifier;
    public AdminReviewService(JdbcTemplate jdbc, SentimentClassifier sentimentClassifier) {
        this.jdbc = jdbc;
        this.sentimentClassifier = sentimentClassifier;
    }

    @Transactional(readOnly = true)
    public ReviewPage list(String search, String sentiment, String status, int requestedPage, int requestedSize) {
        int page = Math.max(requestedPage, 0);
        int size = Math.min(Math.max(requestedSize, 1), 100);
        String query = search == null ? "" : search.trim().toLowerCase();
        String label = normalize(sentiment, "all", List.of("POSITIVE", "NEUTRAL", "NEGATIVE"));
        String visibility = normalize(status, "all", List.of("VISIBLE", "HIDDEN"));
        String where = " WHERE (? = '' OR LOWER(pr.comment) LIKE '%' || ? || '%' OR LOWER(p.name) LIKE '%' || ? || '%' OR LOWER(COALESCE(u.full_name,u.email,'')) LIKE '%' || ? || '%')"
                + " AND (? = 'all' OR pr.sentiment = ?) AND (? = 'all' OR pr.moderation_status = ?)";
        Object[] args = {query, query, query, query, label, label, visibility, visibility};
        Long total = jdbc.queryForObject("SELECT COUNT(*) FROM product_reviews pr JOIN products p ON p.id=pr.product_id JOIN users u ON u.id=pr.user_id" + where,
                Long.class, args);
        List<ReviewResponse> items = jdbc.query("""
                SELECT pr.id,pr.product_id,p.name product_name,COALESCE(u.full_name,u.email,'Người dùng') reviewer_name,
                       u.email reviewer_email,pr.rating,pr.comment,pr.sentiment,pr.sentiment_confidence,
                       pr.sentiment_source,pr.moderation_status,pr.is_sample,pr.created_at
                FROM product_reviews pr JOIN products p ON p.id=pr.product_id JOIN users u ON u.id=pr.user_id
                """ + where + " ORDER BY pr.created_at DESC,pr.id DESC LIMIT ? OFFSET ?",
                (rs, n) -> new ReviewResponse(rs.getLong("id"), rs.getLong("product_id"), rs.getString("product_name"),
                        rs.getString("reviewer_name"), rs.getString("reviewer_email"), rs.getInt("rating"), rs.getString("comment"),
                        rs.getString("sentiment"), rs.getObject("sentiment_confidence") == null ? null : rs.getBigDecimal("sentiment_confidence").doubleValue(),
                        rs.getString("sentiment_source"), rs.getString("moderation_status"), rs.getBoolean("is_sample"),
                        rs.getTimestamp("created_at").toLocalDateTime()),
                query, query, query, query, label, label, visibility, visibility, size, (long) page * size);
        long count = total == null ? 0 : total;
        return new ReviewPage(items, page, size, count, count == 0 ? 0 : (int) Math.ceil((double) count / size));
    }

    @Transactional
    public void updateSentiment(long reviewId, String sentiment) {
        String normalized = sentiment.trim().toUpperCase();
        int changed = jdbc.update("UPDATE product_reviews SET sentiment=?,sentiment_source='ADMIN',sentiment_confidence=1 WHERE id=?",
                normalized, reviewId);
        if (changed == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy bình luận.");
        sentimentClassifier.retrainWithAdminCorrections();
    }

    @Transactional
    public void updateVisibility(long reviewId, String status) {
        List<Long> productIds = jdbc.query("UPDATE product_reviews SET moderation_status=? WHERE id=? RETURNING product_id",
                (rs, n) -> rs.getLong(1), status.trim().toUpperCase(), reviewId);
        if (productIds.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy bình luận.");
        refreshProductRating(productIds.get(0));
    }

    @Transactional
    public void delete(long reviewId) {
        List<Long> productIds = jdbc.query("DELETE FROM product_reviews WHERE id=? RETURNING product_id",
                (rs, n) -> rs.getLong(1), reviewId);
        if (productIds.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy bình luận.");
        long productId = productIds.get(0);
        refreshProductRating(productId);
    }

    private void refreshProductRating(long productId) {
        jdbc.update("UPDATE products SET rating=COALESCE((SELECT ROUND(AVG(rating)::numeric,1) FROM product_reviews WHERE product_id=? AND moderation_status='VISIBLE'),5.0) WHERE id=?",
                productId, productId);
    }

    private String normalize(String raw, String defaultValue, List<String> allowed) {
        if (raw == null || raw.isBlank()) return defaultValue;
        String normalized = raw.trim().toUpperCase();
        if (allowed.contains(normalized)) return normalized;
        if ("ALL".equals(normalized)) return defaultValue;
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bộ lọc không hợp lệ.");
    }
}
