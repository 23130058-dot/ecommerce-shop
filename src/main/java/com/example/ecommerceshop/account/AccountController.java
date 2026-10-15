package com.example.ecommerceshop.account;

import com.example.ecommerceshop.account.AccountDtos.ChangePasswordRequest;
import com.example.ecommerceshop.account.AccountDtos.ProfileResponse;
import com.example.ecommerceshop.account.AccountDtos.UpdateProfileRequest;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/account")
public class AccountController {
    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @GetMapping("/profile")
    public ProfileResponse profile(@AuthenticationPrincipal Jwt jwt) {
        return accountService.getProfile(userId(jwt));
    }

    @PutMapping("/profile")
    public ProfileResponse updateProfile(@AuthenticationPrincipal Jwt jwt,
                                         @Valid @RequestBody UpdateProfileRequest request) {
        return accountService.updateProfile(userId(jwt), request);
    }

    @PutMapping("/password")
    public ResponseEntity<Void> changePassword(@AuthenticationPrincipal Jwt jwt,
                                               @Valid @RequestBody ChangePasswordRequest request) {
        accountService.changePassword(userId(jwt), request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ProfileResponse uploadAvatar(@AuthenticationPrincipal Jwt jwt,
                                       @RequestPart("file") MultipartFile file) {
        return accountService.updateAvatar(userId(jwt), file);
    }

    private long userId(Jwt jwt) {
        Object claim = jwt.getClaim("userId");
        if (claim instanceof Number id) return id.longValue();
        throw new IllegalStateException("JWT does not contain a valid userId claim.");
    }
}
