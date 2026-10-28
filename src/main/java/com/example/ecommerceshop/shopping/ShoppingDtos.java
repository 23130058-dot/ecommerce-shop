package com.example.ecommerceshop.shopping;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public final class ShoppingDtos {
    private ShoppingDtos() {}

    public record ItemRequest(
            @NotNull Long productId,
            @Min(1) Integer quantity,
            LocalDate startDate,
            LocalDate endDate
    ) {}

    public record CartUpdateRequest(
            @Min(1) Integer quantity,
            LocalDate startDate,
            LocalDate endDate
    ) {}

    public record ShoppingItemResponse(
            Long id,
            Long productId,
            String name,
            String type,
            String category,
            String categoryName,
            String brand,
            BigDecimal rating,
            List<String> tags,
            BigDecimal price,
            BigDecimal depositAmount,
            String imageKey,
            Integer availableQuantity,
            String productStatus,
            Integer quantity,
            LocalDate startDate,
            LocalDate endDate
    ) {}

    public record CartResponse(
            List<ShoppingItemResponse> items,
            BigDecimal rentalSubtotal,
            BigDecimal studentDiscountAmount,
            boolean studentDiscountEligible,
            BigDecimal rentalTotal,
            BigDecimal depositTotal,
            BigDecimal serviceFee,
            BigDecimal total
    ) {}

    public record CheckoutRequest(
            @NotBlank String deliveryMethod,
            @Pattern(regexp = "WALLET|MANUAL", flags = Pattern.Flag.CASE_INSENSITIVE)
            String paymentMethod,
            String deliveryAddress,
            String district,
            String city,
            @NotBlank String contactName,
            @NotBlank String contactPhone,
            String contactEmail
    ) {}

    public record CheckoutResponse(
            Long rentalId,
            String rentalCode,
            BigDecimal totalAmount,
            BigDecimal rentalAmount,
            BigDecimal depositAmount,
            BigDecimal serviceFee,
            String status,
            String paymentStatus,
            String paymentMethod,
            LocalDateTime createdAt,
            BigDecimal rentalSubtotal,
            BigDecimal studentDiscountAmount,
            BigDecimal deliveryFee
    ) {}

    public record RentalSummary(
            Long rentalId,
            String rentalCode,
            String status,
            BigDecimal totalAmount,
            BigDecimal depositAmount,
            LocalDateTime createdAt,
            Integer itemCount,
            String firstProductName,
            String firstImageKey
    ) {}

    public record RentalItemDetail(
            Long rentalItemId,
            Long productId,
            String name,
            String imageKey,
            Integer quantity,
            LocalDate startDate,
            LocalDate endDate,
            BigDecimal dailyPrice,
            BigDecimal subtotal,
            String damageDescription,
            BigDecimal damageAmount,
            String damageStatus,
            String disputeStatus,
            BigDecimal depositRefunded,
            BigDecimal depositDeducted,
            String depositStatus
    ) {}

    public record RentalDetail(
            Long rentalId,
            String rentalCode,
            String status,
            BigDecimal totalAmount,
            BigDecimal rentalAmount,
            BigDecimal depositAmount,
            BigDecimal serviceFee,
            BigDecimal studentDiscountAmount,
            BigDecimal deliveryFee,
            String deliveryMethod,
            String deliveryAddress,
            String district,
            String city,
            String contactName,
            String contactPhone,
            String contactEmail,
            String paymentMethod,
            String paymentStatus,
            LocalDateTime createdAt,
            List<RentalItemDetail> items
    ) {}

    public record RenterDashboard(
            String fullName,
            Integer rentingDevices,
            Integer pendingReturns,
            BigDecimal totalDeposit,
            Integer trustScore,
            List<RentalSummary> recentRentals,
            List<RentalSummary> rentalHistory
    ) {}

    public record CurrentRentalItem(
            Long rentalId,
            String rentalCode,
            String rentalStatus,
            Long productId,
            String name,
            String imageKey,
            Integer quantity,
            LocalDate startDate,
            LocalDate endDate,
            BigDecimal dailyPrice,
            BigDecimal subtotal
    ) {}

    public record RentalChatResponse(Long ownerId, String ownerName, String lastMessage,
                                     LocalDateTime lastMessageAt, Long unreadCount) {}

    public record RenterChatConversationResponse(Long rentalId, String rentalCode, Long ownerId,
            String ownerName, String lastMessage, LocalDateTime lastMessageAt, Long unreadCount) {}

    public record RentalChatMessageResponse(Long id, Long senderId, String senderName, String body,
                                            LocalDateTime createdAt, boolean mine) {}

    public record SendRentalChatMessageRequest(@NotBlank String body) {}

    public record RenterNotificationResponse(Long id, String type, String title, String message,
            String targetUrl, LocalDateTime createdAt, LocalDateTime readAt) {}
}
