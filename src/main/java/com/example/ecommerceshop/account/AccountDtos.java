package com.example.ecommerceshop.account;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public final class AccountDtos {
    private AccountDtos() {
    }

    public record ProfileResponse(
            Long id,
            String fullName,
            String email,
            String phone,
            LocalDate birthday,
            String occupation,
            String bio,
            String address,
            String district,
            String city,
            String avatarUrl
    ) {
    }

    public record UpdateProfileRequest(
            @NotBlank(message = "Họ tên không được để trống")
            @Size(max = 100, message = "Họ tên tối đa 100 ký tự")
            String fullName,
            @NotBlank(message = "Email không được để trống")
            @Email(message = "Email không hợp lệ")
            @Size(max = 255, message = "Email tối đa 255 ký tự")
            String email,
            @Size(max = 30, message = "Số điện thoại tối đa 30 ký tự")
            String phone,
            LocalDate birthday,
            @Size(max = 100, message = "Nghề nghiệp tối đa 100 ký tự")
            String occupation,
            @Size(max = 240, message = "Giới thiệu tối đa 240 ký tự")
            String bio,
            @Size(max = 255, message = "Địa chỉ tối đa 255 ký tự")
            String address,
            @Size(max = 100, message = "Quận/huyện tối đa 100 ký tự")
            String district,
            @Size(max = 100, message = "Tỉnh/thành phố tối đa 100 ký tự")
            String city
    ) {
    }

    public record ChangePasswordRequest(
            @NotBlank(message = "Vui lòng nhập mật khẩu hiện tại")
            String currentPassword,
            @NotBlank(message = "Vui lòng nhập mật khẩu mới")
            @Size(min = 8, max = 72, message = "Mật khẩu mới phải có từ 8 đến 72 ký tự")
            String newPassword
    ) {
    }
}
