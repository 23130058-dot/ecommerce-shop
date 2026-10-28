package com.example.ecommerceshop.wallet;

import com.example.ecommerceshop.wallet.WalletDtos.*;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/account/wallet")
public class WalletController {
    private final WalletService walletService;
    public WalletController(WalletService walletService) { this.walletService=walletService; }

    @GetMapping
    public WalletOverview overview(@AuthenticationPrincipal Jwt jwt) { return walletService.overview(userId(jwt)); }

    @PostMapping("/top-ups")
    public WalletOverview topUp(@AuthenticationPrincipal Jwt jwt,@Valid @RequestBody WalletActionRequest request) {
        return walletService.topUp(userId(jwt),request);
    }

    @PostMapping("/withdrawals")
    public WalletOverview withdraw(@AuthenticationPrincipal Jwt jwt,@Valid @RequestBody WithdrawalRequest request) {
        return walletService.withdraw(userId(jwt),request);
    }

    private long userId(Jwt jwt) {
        Long id=jwt==null?null:jwt.getClaim("userId");
        if(id==null) throw new IllegalStateException("JWT không chứa userId.");
        return id;
    }
}
