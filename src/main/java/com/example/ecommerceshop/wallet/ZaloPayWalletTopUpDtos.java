package com.example.ecommerceshop.wallet;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public final class ZaloPayWalletTopUpDtos {
    private ZaloPayWalletTopUpDtos() {}

    public record StartRequest(
            @NotNull @DecimalMin("10000") @DecimalMax("50000000") BigDecimal amount) {}

    public record StartResponse(String orderId, BigDecimal amount, String status, String payUrl, String message) {}

    public record StatusResponse(String orderId, BigDecimal amount, String status, LocalDateTime createdAt) {}

    public record RedirectConfirmation(
            String appId,
            String appTransId,
            String pmcId,
            String bankCode,
            String amount,
            String discountAmount,
            String status,
            String checksum) {}

    public record CallbackRequest(String data, String mac) {}

    public record CallbackResponse(int returncode, String returnmessage) {}
}
