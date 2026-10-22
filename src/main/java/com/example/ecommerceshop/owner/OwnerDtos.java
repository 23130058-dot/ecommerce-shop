package com.example.ecommerceshop.owner;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public final class OwnerDtos {
    private OwnerDtos() {}

    public record CreateProductRequest(
            @NotBlank String name,
            @NotBlank String category,
            String type,
            String brand,
            String description,
            String tags,
            @DecimalMin(value = "1.0") BigDecimal dailyPrice,
            @DecimalMin(value = "0.0") BigDecimal depositAmount,
            @Min(1) Integer quantity,
            String status,
            String imageUrl
    ) {}

    public record ProductResponse(
            Long id,
            String name,
            String type,
            String category,
            String categoryName,
            String brand,
            String description,
            String tags,
            BigDecimal rating,
            BigDecimal dailyPrice,
            BigDecimal depositAmount,
            String imageKey,
            Integer availableQuantity,
            Integer currentlyRentedQuantity,
            String status,
            LocalDateTime createdAt
    ) {}

    public record BookingResponse(
            Long rentalId,
            String rentalCode,
            String renterName,
            String renterPhone,
            String productNames,
            LocalDate startDate,
            LocalDate endDate,
            BigDecimal rentalAmount,
            BigDecimal depositAmount,
            String status,
            String paymentStatus,
            LocalDateTime createdAt
    ) {}

    public record DailyRevenue(LocalDate date, BigDecimal amount) {}

    public record ProductRevenue(
            Long productId,
            String name,
            String type,
            String imageKey,
            BigDecimal dailyPrice,
            BigDecimal amount,
            long paidRentalCount
    ) {}

    public record RevenueResponse(
            LocalDate from,
            LocalDate to,
            BigDecimal totalRevenue,
            long paidRentalCount,
            long productCount,
            List<DailyRevenue> dailyRevenue,
            List<ProductRevenue> productRevenue
    ) {}

    public record ScheduleResponse(
            Long productId, String productName, String imageKey, BigDecimal dailyPrice,
            BigDecimal weekendPrice, BigDecimal depositAmount, boolean available,
            List<LocalDate> blockedDates
    ) {}

    public record SaveScheduleRequest(
            @NotNull @DecimalMin("1.0") BigDecimal dailyPrice,
            @NotNull @DecimalMin("1.0") BigDecimal weekendPrice,
            @NotNull @DecimalMin("0.0") BigDecimal depositAmount,
            @NotNull Boolean available,
            List<LocalDate> blockedDates
    ) {}

    public record ReturnResponse(
            Long rentalItemId, Long rentalId, String rentalCode, String renterName,
            String productName, Integer quantity, LocalDate startDate, LocalDate endDate,
            String status, BigDecimal estimatedAmount, String damageDescription,
            BigDecimal damageAmount, String damageStatus, LocalDateTime createdAt
    ) {}

    public record DamageReportRequest(
            @NotBlank String description,
            @NotNull @DecimalMin("0.0") BigDecimal estimatedAmount
    ) {}

    public record WalletResponse(BigDecimal availableBalance, BigDecimal totalEarnings,
                                 BigDecimal withdrawnAmount, BigDecimal pendingWithdrawals) {}

    public record TransactionResponse(Long id, String title, String subtitle, String type,
                                      BigDecimal amount, String status, LocalDateTime createdAt) {}

    public record WithdrawalRequest(@NotNull @DecimalMin("1.0") BigDecimal amount) {}

    public record ReviewCandidateResponse(Long rentalId, String rentalCode, Long renterId,
                                          String renterName, String productNames, LocalDate startDate,
                                          LocalDate endDate, boolean reviewed, Integer rating,
                                          String comment) {}

    public record OwnerReviewRequest(
            @NotNull Long rentalId,
            @NotNull @Min(1) @jakarta.validation.constraints.Max(5) Integer communicationRating,
            @NotNull @Min(1) @jakarta.validation.constraints.Max(5) Integer punctualityRating,
            @NotNull @Min(1) @jakarta.validation.constraints.Max(5) Integer careRating,
            @NotBlank @Pattern(regexp = "PERFECT|MINOR_WEAR|DAMAGED") String equipmentCondition,
            String comment,
            @NotNull Boolean isPublic
    ) {}

    public record ChatConversationResponse(Long rentalId, String rentalCode, Long renterId,
                                          String renterName, String lastMessage,
                                          LocalDateTime lastMessageAt, Long unreadCount) {}

    public record ChatMessageResponse(Long id, Long senderId, String senderName, String body,
                                      LocalDateTime createdAt, boolean mine) {}

    public record SendChatMessageRequest(@NotBlank String body) {}

    public record NotificationResponse(Long id, String type, String title, String message,
                                       String targetUrl, LocalDateTime createdAt,
                                       LocalDateTime readAt) {}
}
