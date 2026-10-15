package com.example.ecommerceshop.owner;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

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
}
