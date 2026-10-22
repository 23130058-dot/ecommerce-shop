package com.example.ecommerceshop.owner;

import com.example.ecommerceshop.owner.OwnerDtos.BookingResponse;
import com.example.ecommerceshop.owner.OwnerDtos.CreateProductRequest;
import com.example.ecommerceshop.owner.OwnerDtos.ProductResponse;
import com.example.ecommerceshop.owner.OwnerDtos.RevenueResponse;
import com.example.ecommerceshop.owner.OwnerDtos.*;
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
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.DeleteMapping;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/owner")
public class OwnerController {
    private final OwnerService ownerService;
    private final OwnerWorkspaceService workspaceService;

    public OwnerController(OwnerService ownerService, OwnerWorkspaceService workspaceService) {
        this.ownerService = ownerService;
        this.workspaceService = workspaceService;
    }

    @GetMapping("/dashboard")
    public OwnerDashboardResponse dashboard(@AuthenticationPrincipal Jwt jwt) {
        return workspaceService.dashboard(userId(jwt));
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

    @PutMapping("/products/{productId}")
    public ProductResponse updateProduct(@AuthenticationPrincipal Jwt jwt, @PathVariable long productId,
                                         @Valid @RequestBody CreateProductRequest request) {
        return ownerService.updateProduct(userId(jwt), productId, request);
    }

    @GetMapping("/revenue")
    public RevenueResponse revenue(@AuthenticationPrincipal Jwt jwt,
                                   @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                   @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ownerService.getRevenue(userId(jwt), from, to);
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

    @PatchMapping("/bookings/{rentalId}/cancel")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancelBooking(@AuthenticationPrincipal Jwt jwt, @PathVariable long rentalId) {
        workspaceService.cancelBooking(userId(jwt), rentalId);
    }

    @GetMapping("/schedule")
    public List<ScheduleResponse> schedules(@AuthenticationPrincipal Jwt jwt) { return workspaceService.schedules(userId(jwt)); }

    @PutMapping("/schedule/{productId}")
    public ScheduleResponse saveSchedule(@AuthenticationPrincipal Jwt jwt, @PathVariable long productId,
                                         @Valid @RequestBody SaveScheduleRequest request) {
        return workspaceService.saveSchedule(userId(jwt), productId, request);
    }

    @GetMapping("/returns")
    public List<ReturnResponse> returns(@AuthenticationPrincipal Jwt jwt) { return workspaceService.returns(userId(jwt)); }

    @PatchMapping("/returns/{rentalItemId}/confirm")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void confirmReturn(@AuthenticationPrincipal Jwt jwt, @PathVariable long rentalItemId) {
        workspaceService.confirmReturn(userId(jwt), rentalItemId);
    }

    @PostMapping("/returns/{rentalItemId}/damage")
    @ResponseStatus(HttpStatus.CREATED)
    public void reportDamage(@AuthenticationPrincipal Jwt jwt, @PathVariable long rentalItemId,
                             @Valid @RequestBody DamageReportRequest request) {
        workspaceService.reportDamage(userId(jwt), rentalItemId, request);
    }

    @GetMapping("/wallet")
    public WalletResponse wallet(@AuthenticationPrincipal Jwt jwt) { return workspaceService.wallet(userId(jwt)); }

    @GetMapping("/transactions")
    public List<TransactionResponse> transactions(@AuthenticationPrincipal Jwt jwt) { return workspaceService.transactions(userId(jwt)); }

    @PostMapping("/withdrawals")
    public WalletResponse requestWithdrawal(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody WithdrawalRequest request) {
        return workspaceService.requestWithdrawal(userId(jwt), request);
    }

    @GetMapping("/reviews")
    public List<ReviewCandidateResponse> reviews(@AuthenticationPrincipal Jwt jwt) { return workspaceService.reviewCandidates(userId(jwt)); }

    @PostMapping("/reviews")
    @ResponseStatus(HttpStatus.CREATED)
    public void submitReview(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody OwnerReviewRequest request) {
        workspaceService.submitReview(userId(jwt), request);
    }

    @GetMapping("/chats")
    public List<ChatConversationResponse> chats(@AuthenticationPrincipal Jwt jwt) { return workspaceService.chats(userId(jwt)); }

    @GetMapping("/chats/{rentalId}/messages")
    public List<ChatMessageResponse> messages(@AuthenticationPrincipal Jwt jwt, @PathVariable long rentalId) {
        return workspaceService.messages(userId(jwt), rentalId);
    }

    @PostMapping("/chats/{rentalId}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public ChatMessageResponse sendMessage(@AuthenticationPrincipal Jwt jwt, @PathVariable long rentalId,
                                           @Valid @RequestBody SendChatMessageRequest request) {
        return workspaceService.sendMessage(userId(jwt), rentalId, request);
    }

    @GetMapping("/notifications")
    public List<NotificationResponse> notifications(@AuthenticationPrincipal Jwt jwt) { return workspaceService.notifications(userId(jwt)); }

    @PatchMapping("/notifications/read-all")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markNotificationsRead(@AuthenticationPrincipal Jwt jwt) { workspaceService.markNotificationsRead(userId(jwt)); }

    private long userId(Jwt jwt) {
        Long userId = jwt == null ? null : jwt.getClaim("userId");
        if (userId == null) throw new IllegalStateException("JWT không chứa userId.");
        return userId;
    }
}
