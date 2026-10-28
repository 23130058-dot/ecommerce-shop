package com.example.ecommerceshop.marketplace;

import com.example.ecommerceshop.marketplace.MarketplaceDtos.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/marketplace")
public class AdminMarketplaceController {
    private final MarketplaceService service;
    public AdminMarketplaceController(MarketplaceService service) { this.service=service; }

    @GetMapping("/reports")
    public List<MarketplaceReportResponse> reports(@RequestParam(required=false) String status) {
        return service.reports(status);
    }

    @PatchMapping("/reports/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resolveReport(@AuthenticationPrincipal Jwt jwt,@PathVariable long id,
                              @Valid @RequestBody ResolveMarketplaceReportRequest request) {
        service.resolveReport(userId(jwt),id,request);
    }

    @GetMapping("/disputes")
    public List<RentalDisputeResponse> disputes(@RequestParam(required=false) String status) {
        return service.rentalDisputes(status);
    }

    @PatchMapping("/disputes/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resolveDispute(@AuthenticationPrincipal Jwt jwt,@PathVariable long id,
                               @Valid @RequestBody ResolveRentalDisputeRequest request) {
        service.resolveRentalDispute(userId(jwt),id,request);
    }

    private long userId(Jwt jwt) {
        Long id=jwt==null?null:jwt.getClaim("userId");
        if(id==null) throw new IllegalStateException("JWT không chứa userId.");
        return id;
    }
}
