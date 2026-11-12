package com.example.ecommerceshop.admin;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public final class AdminDtos {
    private AdminDtos() {
    }

    public record UserResponse(
            Long id,
            String fullName,
            String email,
            String phone,
            String role,
            String status,
            LocalDateTime createdAt,
            long rentalCount
    ) {
    }

    public record UserPageResponse(
            List<UserResponse> users,
            int page,
            int size,
            long totalElements,
            int totalPages,
            UserSummary summary
    ) {
    }

    public record UserSummary(long totalUsers, long activeUsers, long lockedUsers, long newUsersThisMonth) {
    }

    public record UpdateUserRoleRequest(
            @NotNull
            @Pattern(regexp = "ADMIN|USER", flags = Pattern.Flag.CASE_INSENSITIVE,
                    message = "Vai trò chỉ được là ADMIN hoặc USER")
            String role
    ) {
    }

    public record UpdateUserStatusRequest(
            @NotNull
            @Pattern(regexp = "ACTIVE|LOCKED", flags = Pattern.Flag.CASE_INSENSITIVE,
                    message = "Trạng thái chỉ được là ACTIVE hoặc LOCKED")
            String status
    ) {
    }

    public record CreateUserRequest(
            @NotBlank @Size(max = 160) String fullName,
            @NotBlank @Email @Size(max = 254) String email,
            @Size(max = 40) String phone,
            @NotBlank @Size(min = 8, max = 100) String password,
            @NotNull @Pattern(regexp = "ADMIN|USER", flags = Pattern.Flag.CASE_INSENSITIVE) String role,
            @NotNull @Pattern(regexp = "ACTIVE|LOCKED", flags = Pattern.Flag.CASE_INSENSITIVE) String status
    ) {}

    public record UpdateUserRequest(
            @NotBlank @Size(max = 160) String fullName,
            @NotBlank @Email @Size(max = 254) String email,
            @Size(max = 40) String phone,
            @NotNull @Pattern(regexp = "ADMIN|USER", flags = Pattern.Flag.CASE_INSENSITIVE) String role,
            @NotNull @Pattern(regexp = "ACTIVE|LOCKED", flags = Pattern.Flag.CASE_INSENSITIVE) String status
    ) {}

    public record PageResponse<T>(List<T> items, int page, int size, long totalElements, int totalPages) {
    }

    public record ProductAdminResponse(
            Long id,
            String name,
            String ownerName,
            String ownerEmail,
            String categoryName,
            String brandName,
            BigDecimal dailyPrice,
            BigDecimal depositAmount,
            Integer stock,
            String status,
            String imageKey,
            String description,
            LocalDateTime createdAt,
            String reviewReason
    ) {
    }

    public record UpdateProductStatusRequest(
            @NotNull
            @Pattern(regexp = "ACTIVE|INACTIVE|PENDING", flags = Pattern.Flag.CASE_INSENSITIVE,
                    message = "Trạng thái sản phẩm chỉ được là ACTIVE, INACTIVE hoặc PENDING")
            String status
    ) {
    }

    public record UpdateProductRequest(
            @jakarta.validation.constraints.NotBlank String name,
            @jakarta.validation.constraints.NotBlank String categoryName,
            String brandName,
            String description,
            @NotNull @DecimalMin("1.0") BigDecimal dailyPrice,
            @NotNull @DecimalMin("0.0") BigDecimal depositAmount,
            @NotNull @Min(0) Integer stock,
            @NotNull @Pattern(regexp = "ACTIVE|INACTIVE|PENDING|PENDING_APPROVAL|WAITING_APPROVAL|REJECTED|SUSPENDED", flags = Pattern.Flag.CASE_INSENSITIVE) String status,
            String imageKey
    ) {}

    public record CreateProductRequest(
            @NotNull Long ownerId,
            @NotBlank String name,
            @NotBlank String categoryName,
            String brandName,
            String description,
            @NotNull @DecimalMin("1.0") BigDecimal dailyPrice,
            @NotNull @DecimalMin("0.0") BigDecimal depositAmount,
            @NotNull @Min(0) Integer stock,
            String imageKey
    ) {}

    public record ReviewProductRequest(
            @NotNull @Pattern(regexp = "APPROVE|REJECT", flags = Pattern.Flag.CASE_INSENSITIVE) String decision,
            @Size(max = 2000) String reason
    ) {}

    public record RentalAdminResponse(
            Long id,
            String rentalCode,
            String renterName,
            String renterEmail,
            String contactPhone,
            String status,
            String paymentStatus,
            String deliveryMethod,
            Integer itemCount,
            String productSummary,
            BigDecimal totalAmount,
            LocalDateTime createdAt
    ) {
    }

    public record RentalAdminDetail(
            Long id,
            String rentalCode,
            String renterName,
            String renterEmail,
            String status,
            String paymentStatus,
            String paymentMethod,
            String deliveryMethod,
            String deliveryAddress,
            String district,
            String city,
            String contactName,
            String contactPhone,
            String contactEmail,
            BigDecimal totalAmount,
            BigDecimal rentalAmount,
            BigDecimal depositAmount,
            BigDecimal serviceFee,
            LocalDateTime createdAt,
            List<RentalLineAdmin> items
    ) {
    }

    public record RentalLineAdmin(
            Long productId,
            String productName,
            String ownerName,
            Integer quantity,
            LocalDate startDate,
            LocalDate endDate,
            BigDecimal dailyPrice,
            BigDecimal subtotal,
            String status
    ) {
    }

    public record CreateRentalAdminRequest(
            @NotNull Long renterId,
            @NotNull Long productId,
            @NotNull @Min(1) Integer quantity,
            @NotNull LocalDate startDate,
            @NotNull LocalDate endDate,
            @NotBlank @Pattern(regexp = "HOME|STORE", flags = Pattern.Flag.CASE_INSENSITIVE) String deliveryMethod,
            @Size(max = 500) String deliveryAddress,
            @Size(max = 120) String district,
            @Size(max = 120) String city,
            @NotBlank @Size(max = 160) String contactName,
            @NotBlank @Size(max = 40) String contactPhone,
            @Email @Size(max = 254) String contactEmail
    ) {}

    public record UpdateRentalAdminRequest(
            @NotBlank @Pattern(regexp = "HOME|STORE", flags = Pattern.Flag.CASE_INSENSITIVE) String deliveryMethod,
            @Size(max = 500) String deliveryAddress,
            @Size(max = 120) String district,
            @Size(max = 120) String city,
            @NotBlank @Size(max = 160) String contactName,
            @NotBlank @Size(max = 40) String contactPhone,
            @Email @Size(max = 254) String contactEmail
    ) {}

    public record DashboardResponse(
            long totalUsers,
            long activeUsers,
            long newUsersThisMonth,
            long completedRentals,
            long pendingDevices,
            long openDisputes,
            long pendingVerifications,
            BigDecimal revenueThisMonth,
            List<MonthlyRevenue> monthlyRevenue,
            List<CategoryRevenue> revenueByCategory,
            List<RecentActivity> recentActivities
    ) {
    }

    public record DailyRevenue(LocalDate date, BigDecimal amount, long completedRentals) {}

    public record RevenueTrendResponse(LocalDate from, LocalDate to, BigDecimal totalRevenue,
                                       long completedRentals, List<DailyRevenue> dailyRevenue,
                                       List<CategoryRevenue> revenueByCategory) {}

    public record MonthlyRevenue(String month, BigDecimal amount, long completedRentals) {
    }

    public record CategoryRevenue(String name, BigDecimal amount, double percentage) {
    }

    public record RecentActivity(String type, String description, LocalDateTime occurredAt) {
    }
}
