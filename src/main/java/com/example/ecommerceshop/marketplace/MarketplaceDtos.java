package com.example.ecommerceshop.marketplace;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public final class MarketplaceDtos {
    private MarketplaceDtos() {}

    public record StoreSummary(Long ownerId, String storeName, String ownerName, String description,
                               String city, String avatarUrl, long activeProductCount,
                               BigDecimal averageRating, long rentalCount) {}

    public record StoreProduct(Long id, String name, String type, String category, String brand,
                               BigDecimal rating, BigDecimal price, String imageKey,
                               Integer availableQuantity, long rentalCount) {}

    public record StoreDetail(Long ownerId, String storeName, String ownerName, String description,
                              String city, String avatarUrl, BigDecimal averageRating,
                              long rentalCount, List<StoreProduct> products) {}

    public record StoreProfileRequest(@NotBlank @Size(max = 160) String storeName,
                                      @Size(max = 2000) String description,
                                      @Size(max = 120) String city) {}

    public record CreateMarketplaceReportRequest(
            @NotBlank String targetType,
            Long targetUserId,
            Long productId,
            @NotBlank @Size(max = 80) String category,
            @NotBlank @Size(max = 2000) String description) {}

    public record MarketplaceReportResponse(Long id, String targetType, Long targetUserId,
            String targetName, Long productId, String productName, Long reporterId,
            String reporterName, String category, String description, String status,
            String resolutionNote, LocalDateTime createdAt, LocalDateTime resolvedAt) {}

    public record ResolveMarketplaceReportRequest(@NotBlank String status,
            @Size(max = 2000) String resolutionNote) {}

    public record CreateRentalDisputeRequest(@NotNull Long rentalItemId,
            @NotBlank @Size(max = 2000) String reason,
            @NotNull @DecimalMin("0.0") BigDecimal requestedAmount) {}

    public record RentalDisputeResponse(Long id, Long rentalId, String rentalCode, Long rentalItemId,
            Long productId, String productName, Long renterId, String renterName,
            Long ownerId, String ownerName, Long damageReportId, String damageDescription,
            BigDecimal estimatedAmount, BigDecimal depositAmount, String reason, BigDecimal requestedAmount,
            String status, String resolutionNote, BigDecimal resolvedAmount,
            LocalDateTime createdAt, LocalDateTime resolvedAt) {}

    public record ResolveRentalDisputeRequest(@NotBlank String status,
            @NotBlank @Size(max=2000) String resolutionNote,
            @NotNull @DecimalMin("0.0") BigDecimal resolvedAmount) {}

    public record AvailabilityDay(String date, int availableQuantity, boolean available, String reason) {}
    public record AvailabilityResponse(Long productId, String productName, String from, String to,
                                       List<AvailabilityDay> days) {}
}
