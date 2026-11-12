package com.example.ecommerceshop.wallet;

import com.example.ecommerceshop.wallet.WalletDtos.*;
import com.example.ecommerceshop.wallet.ZaloPayWalletTopUpDtos.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/account/wallet")
public class WalletController {
    private final WalletService walletService;
    private final ZaloPayWalletTopUpService zaloPayTopUpService;
    public WalletController(WalletService walletService, ZaloPayWalletTopUpService zaloPayTopUpService) {
        this.walletService=walletService;
        this.zaloPayTopUpService=zaloPayTopUpService;
    }

    @GetMapping
    public WalletOverview overview(@AuthenticationPrincipal Jwt jwt) { return walletService.overview(userId(jwt)); }

    @PostMapping("/top-ups/zalopay")
    public StartResponse startZaloPayTopUp(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody StartRequest request) {
        return zaloPayTopUpService.start(userId(jwt), request);
    }

    @GetMapping("/top-ups/zalopay/{appTransId}")
    public StatusResponse zaloPayTopUpStatus(@AuthenticationPrincipal Jwt jwt, @PathVariable String appTransId) {
        return zaloPayTopUpService.status(userId(jwt), appTransId);
    }

    @PostMapping("/top-ups/zalopay/redirect")
    public StatusResponse zaloPayRedirect(@AuthenticationPrincipal Jwt jwt, @RequestBody RedirectConfirmation redirect) {
        return zaloPayTopUpService.confirmRedirect(userId(jwt), redirect);
    }

    @PostMapping("/top-ups/zalopay/callback")
    public CallbackResponse zaloPayCallback(@RequestBody CallbackRequest callback) {
        return zaloPayTopUpService.acceptCallback(callback);
    }

    @PostMapping("/withdrawals")
    public WalletOverview withdraw(@AuthenticationPrincipal Jwt jwt,
                                   @Valid @RequestBody WithdrawalRequest request) {
        return walletService.withdraw(userId(jwt), request.amount());
    }

    private long userId(Jwt jwt) {
        Long id=jwt==null?null:jwt.getClaim("userId");
        if(id==null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"JWT không chứa userId.");
        return id;
    }
}
