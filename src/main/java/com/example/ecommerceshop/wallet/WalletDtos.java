package com.example.ecommerceshop.wallet;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public final class WalletDtos {
    private WalletDtos() {}

    public record WalletTransaction(Long id, String type, BigDecimal amount, String status,
            BigDecimal availableAfter, BigDecimal heldAfter, String description, LocalDateTime createdAt) {}

    public record WithdrawalRequest(@NotNull @DecimalMin("1") BigDecimal amount) {}

    public record WalletOverview(BigDecimal availableBalance, BigDecimal heldBalance,
            BigDecimal totalTopUps, BigDecimal totalWithdrawals, BigDecimal totalOwnerEarnings,
            BigDecimal pendingWithdrawals, List<WalletTransaction> transactions) {}
}
