package com.example.ecommerceshop.review;

import com.example.ecommerceshop.review.ProductReviewDtos.CreateReviewRequest;
import com.example.ecommerceshop.review.ProductReviewDtos.ReviewsResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/products/{productId}/reviews")
public class ProductReviewController {
    private final ProductReviewService reviewService;

    public ProductReviewController(ProductReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping
    public ReviewsResponse reviews(@PathVariable long productId,
                                   @AuthenticationPrincipal Jwt jwt,
                                   @RequestParam(defaultValue = "0") int page,
                                   @RequestParam(defaultValue = "10") int size) {
        return reviewService.getReviews(productId, userIdOrNull(jwt), page, size);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void createReview(@PathVariable long productId,
                             @AuthenticationPrincipal Jwt jwt,
                             @Valid @RequestBody CreateReviewRequest request) {
        reviewService.createReview(userId(jwt), productId, request);
    }

    private Long userIdOrNull(Jwt jwt) {
        if (jwt == null) return null;
        Object claim = jwt.getClaim("userId");
        return claim instanceof Number id ? id.longValue() : null;
    }

    private long userId(Jwt jwt) {
        Long userId = userIdOrNull(jwt);
        if (userId == null) throw new IllegalStateException("JWT không chứa userId.");
        return userId;
    }
}
