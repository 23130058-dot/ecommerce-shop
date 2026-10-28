package com.example.ecommerceshop.marketplace;

import com.example.ecommerceshop.marketplace.MarketplaceDtos.CreateMarketplaceReportRequest;
import com.example.ecommerceshop.marketplace.MarketplaceDtos.StoreDetail;
import com.example.ecommerceshop.marketplace.MarketplaceDtos.StoreSummary;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stores")
public class MarketplaceController {
    private final MarketplaceService marketplaceService;

    public MarketplaceController(MarketplaceService marketplaceService) {
        this.marketplaceService = marketplaceService;
    }

    @GetMapping
    public List<StoreSummary> stores(@RequestParam(required=false) String search,
                                     @RequestParam(defaultValue="popular") String sort) {
        return marketplaceService.stores(search,sort);
    }

    @GetMapping("/{ownerId}")
    public StoreDetail store(@PathVariable long ownerId) {
        return marketplaceService.store(ownerId);
    }

    @PostMapping("/reports")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String,Long> report(@AuthenticationPrincipal Jwt jwt,
                                   @Valid @RequestBody CreateMarketplaceReportRequest request) {
        Long userId=jwt==null?null:jwt.getClaim("userId");
        if(userId==null) throw new IllegalStateException("JWT không chứa userId.");
        return Map.of("id",marketplaceService.createReport(userId,request));
    }
}
