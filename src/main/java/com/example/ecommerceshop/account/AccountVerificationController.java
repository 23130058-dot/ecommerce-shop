package com.example.ecommerceshop.account;

import com.example.ecommerceshop.account.VerificationDtos.ConfirmPhoneRequest;
import com.example.ecommerceshop.account.VerificationDtos.PhoneCodeRequest;
import com.example.ecommerceshop.account.VerificationDtos.PhoneCodeResponse;
import com.example.ecommerceshop.account.VerificationDtos.VerificationResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/account/verification")
public class AccountVerificationController {
    private final AccountVerificationService service;

    public AccountVerificationController(AccountVerificationService service) { this.service = service; }

    @GetMapping
    public VerificationResponse verification(@AuthenticationPrincipal Jwt jwt) {
        return service.get(userId(jwt));
    }

    @PostMapping("/phone-code")
    public PhoneCodeResponse sendPhoneCode(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody PhoneCodeRequest request) {
        return service.sendPhoneCode(userId(jwt), request);
    }

    @PostMapping("/phone-confirm")
    public VerificationResponse confirmPhone(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ConfirmPhoneRequest request) {
        return service.confirmPhone(userId(jwt), request);
    }

    @PostMapping(value = "/documents/{type}", consumes = "multipart/form-data")
    public VerificationResponse submitDocument(@AuthenticationPrincipal Jwt jwt, @PathVariable String type,
                                                @RequestPart("file") MultipartFile file) {
        return service.submitDocument(userId(jwt), type, file);
    }

    private long userId(Jwt jwt) {
        Object claim = jwt == null ? null : jwt.getClaim("userId");
        if (claim instanceof Number id) return id.longValue();
        throw new IllegalStateException("JWT không chứa userId hợp lệ.");
    }
}
