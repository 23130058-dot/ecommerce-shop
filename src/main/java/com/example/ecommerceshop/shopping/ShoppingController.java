package com.example.ecommerceshop.shopping;

import com.example.ecommerceshop.shopping.ShoppingDtos.CartResponse;
import com.example.ecommerceshop.shopping.ShoppingDtos.CartUpdateRequest;
import com.example.ecommerceshop.shopping.ShoppingDtos.CheckoutResponse;
import com.example.ecommerceshop.shopping.ShoppingDtos.CheckoutRequest;
import com.example.ecommerceshop.shopping.ShoppingDtos.ItemRequest;
import com.example.ecommerceshop.shopping.ShoppingDtos.ShoppingItemResponse;
import com.example.ecommerceshop.shopping.ShoppingDtos.RenterDashboard;
import com.example.ecommerceshop.shopping.ShoppingDtos.RentalDetail;
import com.example.ecommerceshop.shopping.ShoppingDtos.RentalSummary;
import com.example.ecommerceshop.shopping.ShoppingDtos.CurrentRentalItem;
import com.example.ecommerceshop.shopping.ShoppingDtos.RentalChatResponse;
import com.example.ecommerceshop.shopping.ShoppingDtos.RentalChatMessageResponse;
import com.example.ecommerceshop.shopping.ShoppingDtos.SendRentalChatMessageRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/shopping")
public class ShoppingController {
    private final ShoppingService shoppingService;

    public ShoppingController(ShoppingService shoppingService) {
        this.shoppingService = shoppingService;
    }

    @GetMapping("/wishlist")
    public List<ShoppingItemResponse> wishlist(@AuthenticationPrincipal Jwt jwt) {
        return shoppingService.getWishlist(userId(jwt));
    }

    @PostMapping("/wishlist")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void addWishlist(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ItemRequest request) {
        shoppingService.addWishlist(userId(jwt), request.productId());
    }

    @DeleteMapping("/wishlist/{productId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeWishlist(@AuthenticationPrincipal Jwt jwt, @PathVariable long productId) {
        shoppingService.removeWishlist(userId(jwt), productId);
    }

    @DeleteMapping("/wishlist")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void clearWishlist(@AuthenticationPrincipal Jwt jwt) {
        shoppingService.clearWishlist(userId(jwt));
    }

    @GetMapping("/compare")
    public List<ShoppingItemResponse> compare(@AuthenticationPrincipal Jwt jwt) {
        return shoppingService.getCompare(userId(jwt));
    }

    @PostMapping("/compare")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void addCompare(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ItemRequest request) {
        shoppingService.addCompare(userId(jwt), request.productId());
    }

    @DeleteMapping("/compare/{productId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeCompare(@AuthenticationPrincipal Jwt jwt, @PathVariable long productId) {
        shoppingService.removeCompare(userId(jwt), productId);
    }

    @DeleteMapping("/compare")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void clearCompare(@AuthenticationPrincipal Jwt jwt) {
        shoppingService.clearCompare(userId(jwt));
    }

    @GetMapping("/cart")
    public CartResponse cart(@AuthenticationPrincipal Jwt jwt) {
        return shoppingService.getCart(userId(jwt));
    }

    @PostMapping("/cart")
    public CartResponse addCart(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ItemRequest request) {
        return shoppingService.addCartItem(userId(jwt), request);
    }

    @PutMapping("/cart/{itemId}")
    public CartResponse updateCart(@AuthenticationPrincipal Jwt jwt, @PathVariable long itemId,
                                   @Valid @RequestBody CartUpdateRequest request) {
        return shoppingService.updateCartItem(userId(jwt), itemId, request);
    }

    @DeleteMapping("/cart/{itemId}")
    public CartResponse removeCart(@AuthenticationPrincipal Jwt jwt, @PathVariable long itemId) {
        return shoppingService.removeCartItem(userId(jwt), itemId);
    }

    @DeleteMapping("/cart")
    public CartResponse clearCart(@AuthenticationPrincipal Jwt jwt) {
        return shoppingService.clearCart(userId(jwt));
    }

    @PostMapping("/cart/checkout")
    public CheckoutResponse checkout(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody CheckoutRequest request) {
        return shoppingService.checkout(userId(jwt), request);
    }

    @GetMapping("/renter/dashboard")
    public RenterDashboard renterDashboard(@AuthenticationPrincipal Jwt jwt) {
        return shoppingService.getRenterDashboard(userId(jwt));
    }

    @GetMapping("/rentals")
    public List<RentalSummary> rentals(@AuthenticationPrincipal Jwt jwt) {
        return shoppingService.getRentals(userId(jwt));
    }

    @GetMapping("/renter/current-rentals")
    public List<CurrentRentalItem> currentRentalItems(@AuthenticationPrincipal Jwt jwt) {
        return shoppingService.getCurrentRentalItems(userId(jwt));
    }

    @GetMapping("/rentals/{rentalId}")
    public RentalDetail rental(@AuthenticationPrincipal Jwt jwt, @PathVariable long rentalId) {
        return shoppingService.getRental(userId(jwt), rentalId);
    }

    @PatchMapping("/rentals/{rentalId}/cancel")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancelRental(@AuthenticationPrincipal Jwt jwt,@PathVariable long rentalId) {
        shoppingService.cancelRental(userId(jwt),rentalId);
    }

    @PostMapping("/rentals/{rentalId}/return")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void requestReturn(@AuthenticationPrincipal Jwt jwt,@PathVariable long rentalId) {
        shoppingService.requestReturn(userId(jwt),rentalId);
    }

    @GetMapping("/rentals/{rentalId}/chats")
    public List<RentalChatResponse> rentalChats(@AuthenticationPrincipal Jwt jwt, @PathVariable long rentalId) {
        return shoppingService.getRentalChats(userId(jwt), rentalId);
    }

    @GetMapping("/rentals/{rentalId}/chats/{ownerId}/messages")
    public List<RentalChatMessageResponse> rentalChatMessages(@AuthenticationPrincipal Jwt jwt,
            @PathVariable long rentalId, @PathVariable long ownerId) {
        return shoppingService.getRentalChatMessages(userId(jwt), rentalId, ownerId);
    }

    @PostMapping("/rentals/{rentalId}/chats/{ownerId}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public RentalChatMessageResponse sendRentalChatMessage(@AuthenticationPrincipal Jwt jwt,
            @PathVariable long rentalId, @PathVariable long ownerId,
            @Valid @RequestBody SendRentalChatMessageRequest request) {
        return shoppingService.sendRentalChatMessage(userId(jwt), rentalId, ownerId, request);
    }

    private long userId(Jwt jwt) {
        Long userId = jwt == null ? null : jwt.getClaim("userId");
        if (userId == null) throw new IllegalStateException("JWT không chứa userId.");
        return userId;
    }
}
