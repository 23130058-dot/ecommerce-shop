package com.example.ecommerceshop.account;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public final class PhoneNumbers {
    private PhoneNumbers() {}

    public static String normalize(String input) {
        String phone = input == null ? "" : input.trim().replaceAll("[\\s().-]", "");
        if (phone.startsWith("00")) phone = "+" + phone.substring(2);
        if (!phone.startsWith("+")) {
            if (phone.startsWith("0")) phone = "+84" + phone.substring(1);
            else if (phone.startsWith("84")) phone = "+" + phone;
            else phone = "+" + phone;
        }
        long digits = phone.chars().filter(Character::isDigit).count();
        if (!phone.matches("\\+[0-9]{8,15}") || digits < 8)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số điện thoại không hợp lệ. Hãy nhập số có mã quốc gia, ví dụ +84912345678.");
        return phone;
    }

    public static String[] lookupDigits(String normalized) {
        String digits = normalized.replaceAll("\\D", "");
        String local = digits.startsWith("84") ? "0" + digits.substring(2) : digits;
        return new String[]{digits, local};
    }
}
