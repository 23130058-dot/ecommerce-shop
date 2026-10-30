
package com.example.ecommerceshop.owner;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public final class OwnerDtos {

    private OwnerDtos() {
    }

    public record ProductResponse(
            Long id,
            String name,
            String type,
            String category,
            String categoryName,
            String brand,
            String description,
            BigDecimal dailyPrice,
            BigDecimal depositAmount,
            Integer stock,
            Integer availableQuantity,
            String status,
            String imageKey,
            List<String> images,
            List<String> tags,
            Integer currentlyRentedQuantity
    ) {
    }

    public record CreateProductRequest(
            String name,
            String category,
            String type,
            String brand,
            List<String> tags,
            BigDecimal dailyPrice,
            BigDecimal depositAmount,
            Integer quantity,
            String description,
            String status,
            String imageUrl
    ) {
    }

    public record UpdateProductRequest(
            String name,
            String category,
            String type,
            String brand,
            List<String> tags,
            BigDecimal dailyPrice,
            BigDecimal depositAmount,
            Integer quantity,
            String description,
            String status,
            String imageUrl
    ) {
    }

    public record RentalResponse(
            Long id,
            String rentalCode,
            String renterName,
            String renterPhone,
            List<String> productNames,
            LocalDate startDate,
            LocalDate endDate,
            BigDecimal rentalAmount,
            BigDecimal depositAmount,
            String status,
            String paymentStatus
    ) {
    }

    public record MonthlyRevenue(
            String month,
            BigDecimal revenue
    ) {
    }

    public record RevenueResponse(
            List<MonthlyRevenue> monthlyRevenue,
            BigDecimal totalRevenue
    ) {
    }

    public record ProfileResponse(
            Long id,
            String fullName,
            String email,
            String phone,
            String address,
            String district,
            String city
    ) {
    }

    public record UpdateProfileRequest(
            String fullName,
            String phone,
            String address,
            String district,
            String city
    ) {
    }
}
