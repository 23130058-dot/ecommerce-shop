package com.example.ecommerceshop.marketplace;

import com.example.ecommerceshop.marketplace.MarketplaceDtos.StoreProfileRequest;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/owner/storefront")
public class OwnerStorefrontController {
    private final OwnerStorefrontService service;
    public OwnerStorefrontController(OwnerStorefrontService service) { this.service=service; }

    @GetMapping
    public StoreProfileRequest profile(@AuthenticationPrincipal Jwt jwt) {
        return service.profile(userId(jwt));
    }

    @PutMapping
    public StoreProfileRequest update(@AuthenticationPrincipal Jwt jwt,@Valid @RequestBody StoreProfileRequest request) {
        return service.update(userId(jwt),request);
    }

    @PostMapping(value = "/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public MarketplaceDtos.StoreImageUploadResponse uploadImage(@AuthenticationPrincipal Jwt jwt,
            @RequestParam String kind, @RequestPart("file") MultipartFile file) {
        return service.uploadImage(userId(jwt), kind, file);
    }

    private long userId(Jwt jwt) {
        Long id=jwt==null?null:jwt.getClaim("userId");
        if(id==null) throw new IllegalStateException("JWT không chứa userId.");
        return id;
    }
}
