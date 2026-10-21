package com.example.ecommerceshop.owner;

import com.example.ecommerceshop.owner.OwnerDtos.CreateProductRequest;
import com.example.ecommerceshop.owner.OwnerDtos.ProductResponse;
import com.example.ecommerceshop.owner.OwnerDtos.UpdateProductRequest;
import com.example.ecommerceshop.owner.OwnerDtos.RentalResponse;
import com.example.ecommerceshop.owner.OwnerDtos.RevenueResponse;
import com.example.ecommerceshop.owner.OwnerDtos.ProfileResponse;
import com.example.ecommerceshop.owner.OwnerDtos.UpdateProfileRequest;
import org.springframework.web.bind.annotation.RequestParam;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/owner")
public class OwnerController {

    private final OwnerService ownerService;

    public OwnerController(OwnerService ownerService) {
        this.ownerService = ownerService;
    }

    @GetMapping("/products")
    public List<ProductResponse> getProducts(
            @AuthenticationPrincipal Jwt jwt
    ) {
        return ownerService.getProducts(jwt);
    }

    @GetMapping("/products/{productId}")
    public ProductResponse getProductById(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long productId
    ) {
        return ownerService.getProductById(jwt, productId);
    }

    @PostMapping("/products")
    public ProductResponse createProduct(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody CreateProductRequest request
    ) {
        return ownerService.createProduct(jwt, request);
    }

    @PutMapping("/products/{productId}")
    public ProductResponse updateProduct(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long productId,
            @RequestBody UpdateProductRequest request
    ) {
        return ownerService.updateProduct(jwt, productId, request);
    }


    @GetMapping("/bookings")
    public List<RentalResponse> getBookings(
            @AuthenticationPrincipal Jwt jwt
    ) {
        return ownerService.getBookings(jwt);
    }

    @PatchMapping("/bookings/{rentalId}/confirm")
    public RentalResponse confirmBooking(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long rentalId
    ) {
        return ownerService.confirmBooking(jwt, rentalId);
    }

    @PatchMapping("/bookings/{rentalId}/complete")
    public RentalResponse completeBooking(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long rentalId
    ) {
        return ownerService.completeBooking(jwt, rentalId);
    }

    @GetMapping("/revenue")
    public RevenueResponse getRevenue(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) Integer year
    ) {
        return ownerService.getRevenue(jwt, year);
    }

    @GetMapping("/profile")
    public ProfileResponse getProfile(
            @AuthenticationPrincipal Jwt jwt
    ) {
        return ownerService.getProfile(jwt);
    }

    @PutMapping("/profile")
    public ProfileResponse updateProfile(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody UpdateProfileRequest request
    ) {
        return ownerService.updateProfile(jwt, request);
    }
}