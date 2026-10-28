package com.example.ecommerceshop.account;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public final class VerificationDtos {
    private VerificationDtos() {}

    public record VerificationResponse(
            String phone,
            boolean phoneVerified,
            LocalDateTime phoneVerifiedAt,
            String studentCardStatus,
            String studentCardReviewNote,
            LocalDateTime studentCardSubmittedAt,
            String identityStatus,
            String identityReviewNote,
            LocalDateTime identitySubmittedAt
    ) {}

    public record PhoneCodeRequest(@NotBlank @Size(max = 30) String phone) {}
    public record ConfirmPhoneRequest(
            @NotBlank @Size(max = 30) String phone,
            @NotBlank @Pattern(regexp = "\\d{6}", message = "Mã xác minh gồm 6 chữ số.") String code
    ) {}
    public record PhoneCodeResponse(String phone, String demoCode, LocalDateTime expiresAt) {}

    public record AdminVerificationResponse(
            Long userId,
            String fullName,
            String email,
            String phone,
            String studentCardStatus,
            String studentCardReviewNote,
            LocalDateTime studentCardSubmittedAt,
            String identityStatus,
            String identityReviewNote,
            LocalDateTime identitySubmittedAt
    ) {}

    public record VerificationReviewRequest(
            @NotBlank @Pattern(regexp = "APPROVED|REJECTED", flags = Pattern.Flag.CASE_INSENSITIVE) String status,
            @Size(max = 1000) String note
    ) {}

    public record VerificationDocument(byte[] content, String contentType, String fileName) {}
}
