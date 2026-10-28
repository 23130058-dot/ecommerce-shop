package com.example.ecommerceshop.marketplace;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public final class ProductChatDtos {
    private ProductChatDtos() {}

    public record ConversationResponse(Long productId, String productName, Long ownerId,
            Long peerId, String peerName, String lastMessage, LocalDateTime lastMessageAt,
            Long unreadCount) {}

    public record MessageResponse(Long id, Long senderId, String senderName, String body,
            LocalDateTime createdAt, boolean mine) {}

    public record SendMessageRequest(@NotBlank @Size(max = 2000) String body) {}

}
