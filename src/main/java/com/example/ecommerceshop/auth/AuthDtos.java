package com.example.ecommerceshop.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AuthDtos {
    private AuthDtos() {
    }

    public record RegisterRequest(
            @NotBlank(message = "Họ tên không được để trống")
            @Size(max = 100, message = "Họ tên tối đa 100 ký tự")
            String fullName,
            @NotBlank(message = "Email không được để trống")
            @Email(message = "Email không hợp lệ")
            @Size(max = 255, message = "Email tối đa 255 ký tự")
            String email,
            @NotBlank(message = "Mật khẩu không được để trống")
            @Size(min = 8, max = 72, message = "Mật khẩu phải có từ 8 đến 72 ký tự")
            String password,
            @Size(max = 30, message = "Số điện thoại tối đa 30 ký tự")
            String phone
    ) {
    }

    public record LoginRequest(
            @NotBlank(message = "Email không được để trống")
            @Email(message = "Email không hợp lệ")
            @Size(max = 255)
            String email,
            @NotBlank(message = "Mật khẩu không được để trống")
            String password
    ) {
    }

    public record AuthUserResponse(Long id, String fullName, String email, String role) {
    }

    public record AuthResponse(
            String accessToken,
            String tokenType,
            long expiresIn,
            AuthUserResponse user
    ) {
    }
}