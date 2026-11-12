package com.example.ecommerceshop.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

import java.time.LocalDateTime;
import java.util.List;

public final class AdminReviewDtos {
    private AdminReviewDtos() {}

    public record ReviewResponse(long id, long productId, String productName, String reviewerName,
                                 String reviewerEmail, int rating, String comment, String sentiment,
                                 Double sentimentConfidence, String sentimentSource, String moderationStatus,
                                 boolean sample, LocalDateTime createdAt) {}

    public record ReviewPage(List<ReviewResponse> items, int page, int size, long totalElements, int totalPages) {}

    public record SentimentUpdateRequest(
            @NotBlank @Pattern(regexp = "POSITIVE|NEUTRAL|NEGATIVE", flags = Pattern.Flag.CASE_INSENSITIVE)
            String sentiment) {}

    public record VisibilityUpdateRequest(
            @NotBlank @Pattern(regexp = "VISIBLE|HIDDEN", flags = Pattern.Flag.CASE_INSENSITIVE)
            String status) {}
}
