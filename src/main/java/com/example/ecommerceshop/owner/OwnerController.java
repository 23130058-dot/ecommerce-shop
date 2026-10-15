package com.example.ecommerceshop.owner;

import com.example.ecommerceshop.owner.OwnerDtos.BookingResponse;
import com.example.ecommerceshop.owner.OwnerDtos.CreateProductRequest;
import com.example.ecommerceshop.owner.OwnerDtos.ProductResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/owner")
public class OwnerController {
    private final OwnerService ownerService;

    public OwnerController(OwnerService ownerService) {
        this.ownerService = ownerService;
    }

    @GetMapping("/products")
    public List<ProductResponse> products(@AuthenticationPrincipal Jwt jwt) {
        return ownerService.getProducts(userId(jwt));
    }

    @PostMapping("/products")
    @ResponseStatus(HttpStatus.CREATED)
    public ProductResponse createProduct(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody CreateProductRequest request) {
        return ownerService.createProduct(userId(jwt), request);
    }

    @GetMapping("/bookings")
    public List<BookingResponse> bookings(@AuthenticationPrincipal Jwt jwt) {
        return ownerService.getBookings(userId(jwt));
    }

    @PatchMapping("/bookings/{rentalId}/confirm")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void confirmBooking(@AuthenticationPrincipal Jwt jwt, @PathVariable long rentalId) {
        ownerService.confirmBooking(userId(jwt), rentalId);
    }

    @PatchMapping("/bookings/{rentalId}/complete")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void completeBooking(@AuthenticationPrincipal Jwt jwt, @PathVariable long rentalId) {
        ownerService.completeBooking(userId(jwt), rentalId);
    }

    private long userId(Jwt jwt) {
        Long userId = jwt == null ? null : jwt.getClaim("userId");
        if (userId == null) throw new IllegalStateException("JWT không chứa userId.");
        return userId;
    }
}
