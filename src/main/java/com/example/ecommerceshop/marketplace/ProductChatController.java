package com.example.ecommerceshop.marketplace;

import com.example.ecommerceshop.marketplace.ProductChatDtos.ConversationResponse;
import com.example.ecommerceshop.marketplace.ProductChatDtos.MessageResponse;
import com.example.ecommerceshop.marketplace.ProductChatDtos.SendMessageRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/product-chats")
public class ProductChatController {
    private final ProductChatService service;

    public ProductChatController(ProductChatService service) {
        this.service = service;
    }

    @GetMapping
    public List<ConversationResponse> conversations(@AuthenticationPrincipal Jwt jwt) {
        return service.conversations(userId(jwt));
    }

    @GetMapping("/{productId}/{peerId}/messages")
    public List<MessageResponse> messages(@AuthenticationPrincipal Jwt jwt,
            @PathVariable long productId, @PathVariable long peerId) {
        return service.messages(userId(jwt), productId, peerId);
    }

    @PostMapping("/{productId}/{peerId}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public MessageResponse send(@AuthenticationPrincipal Jwt jwt, @PathVariable long productId,
            @PathVariable long peerId, @Valid @RequestBody SendMessageRequest request) {
        return service.send(userId(jwt), productId, peerId, request);
    }

    private long userId(Jwt jwt) {
        Long id = jwt == null ? null : jwt.getClaim("userId");
        if (id == null) throw new IllegalStateException("JWT không chứa userId.");
        return id;
    }
}
