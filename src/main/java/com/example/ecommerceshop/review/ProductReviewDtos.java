package com.example.ecommerceshop.review;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public final class ProductReviewDtos {
    private ProductReviewDtos() {
    }

    public record CreateReviewRequest(
            @NotNull @Min(1) @Max(5) Integer rating,
            @NotBlank @Size(max = 2000) String comment
    ) {
    }

    public record ReviewResponse(
            Long id,
            String reviewerName,
            String avatarUrl,
            Integer rating,
            String comment,
            LocalDateTime createdAt,
            boolean verifiedRenter,
            boolean sample
    ) {
    }

    public record ReviewsResponse(
            BigDecimal averageRating,
            long reviewCount,
            Map<Integer, Long> ratingDistribution,
            boolean canReview,
            boolean hasReviewed,
            List<ReviewResponse> reviews,
            int page,
            int size,
            int totalPages
    ) {
    }
}