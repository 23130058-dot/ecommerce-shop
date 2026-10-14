package com.example.ecommerceshop.admin;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;
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

    public record UpdateUserStatusRequest(
            @NotNull
            @Pattern(regexp = "ACTIVE|LOCKED", flags = Pattern.Flag.CASE_INSENSITIVE,
                    message = "Trạng thái chỉ được là ACTIVE hoặc LOCKED")
            String status
    ) {
    }

    public record DashboardResponse(
            long totalUsers,
            long activeUsers,
            long newUsersThisMonth,
            long completedRentals,
            long pendingDevices,
            long openDisputes,
            BigDecimal revenueThisMonth,
            List<MonthlyRevenue> monthlyRevenue,
            List<CategoryRevenue> revenueByCategory,
            List<RecentActivity> recentActivities
    ) {
    }

    public record MonthlyRevenue(String month, BigDecimal amount, long completedRentals) {
    }

    public record CategoryRevenue(String name, BigDecimal amount, double percentage) {
    }

    public record RecentActivity(String type, String description, LocalDateTime occurredAt) {
    }
}
