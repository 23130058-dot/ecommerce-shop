package com.example.ecommerceshop.wallet;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public final class WalletDtos {
    private WalletDtos() {}

    public record WalletActionRequest(
            @NotNull @DecimalMin("10000.0") @DecimalMax("50000000.0") BigDecimal amount,
            @NotNull @Pattern(regexp = "SUCCESS|FAILED|PENDING") String simulatedResult) {}

    public record WithdrawalRequest(
            @NotNull @DecimalMin("10000.0") @DecimalMax("50000000.0") BigDecimal amount,
            @NotNull @Pattern(regexp = "SUCCESS|FAILED") String simulatedResult) {}

    public record WalletTransaction(Long id, String type, BigDecimal amount, String status,
            BigDecimal availableAfter, BigDecimal heldAfter, String description, LocalDateTime createdAt) {}

    public record WalletOverview(BigDecimal availableBalance, BigDecimal heldBalance,
            BigDecimal totalTopUps, BigDecimal totalWithdrawals, BigDecimal totalOwnerEarnings,
            BigDecimal pendingWithdrawals, List<WalletTransaction> transactions) {}
}
