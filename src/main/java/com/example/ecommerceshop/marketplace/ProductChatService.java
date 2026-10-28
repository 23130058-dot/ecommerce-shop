package com.example.ecommerceshop.marketplace;

import com.example.ecommerceshop.marketplace.ProductChatDtos.ConversationResponse;
import com.example.ecommerceshop.marketplace.ProductChatDtos.MessageResponse;
import com.example.ecommerceshop.marketplace.ProductChatDtos.SendMessageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ProductChatService {
    private final JdbcTemplate jdbc;

    public ProductChatService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional(readOnly = true)
    public List<ConversationResponse> conversations(long userId) {
        return jdbc.query("""
                WITH threads AS (
                    SELECT DISTINCT m.product_id,p.name product_name,p.owner_id,
                           CASE WHEN m.sender_id=? THEN m.receiver_id ELSE m.sender_id END peer_id
                    FROM owner_product_messages m JOIN products p ON p.id=m.product_id
                    WHERE m.sender_id=? OR m.receiver_id=?
                )
                SELECT t.product_id,t.product_name,t.owner_id,t.peer_id,
                       COALESCE(peer.full_name,peer.email,'Người dùng') peer_name,
                       last.body last_message,last.created_at last_message_at,
                       (SELECT COUNT(*) FROM owner_product_messages incoming
                        WHERE incoming.product_id=t.product_id AND incoming.sender_id=t.peer_id
                          AND incoming.receiver_id=? AND incoming.read_at IS NULL) unread_count
                FROM threads t JOIN users peer ON peer.id=t.peer_id
                JOIN LATERAL (SELECT body,created_at FROM owner_product_messages m
                              WHERE m.product_id=t.product_id
                                AND ((m.sender_id=? AND m.receiver_id=t.peer_id)
                                  OR (m.sender_id=t.peer_id AND m.receiver_id=?))
                              ORDER BY m.id DESC LIMIT 1) last ON TRUE
                ORDER BY last.created_at DESC,t.product_id DESC
                """, (rs, n) -> new ConversationResponse(rs.getLong("product_id"),
                rs.getString("product_name"), rs.getLong("owner_id"), rs.getLong("peer_id"),
                rs.getString("peer_name"), rs.getString("last_message"),
                local(rs.getTimestamp("last_message_at")), rs.getLong("unread_count")),
                userId, userId, userId, userId, userId, userId);
    }

    @Transactional
    public List<MessageResponse> messages(long userId, long productId, long peerId) {
        long ownerId = requireProductOwner(productId);
        requireParticipants(userId, productId, ownerId, peerId);
        jdbc.update("""
                UPDATE owner_product_messages SET read_at=CURRENT_TIMESTAMP
                WHERE product_id=? AND sender_id=? AND receiver_id=? AND read_at IS NULL
                """, productId, peerId, userId);
        return jdbc.query("""
                SELECT m.id,m.sender_id,COALESCE(u.full_name,u.email,'Người dùng') sender_name,
                       m.body,m.created_at
                FROM owner_product_messages m JOIN users u ON u.id=m.sender_id
                WHERE m.product_id=? AND ((m.sender_id=? AND m.receiver_id=?)
                    OR (m.sender_id=? AND m.receiver_id=?))
                ORDER BY m.id
                """, (rs, n) -> new MessageResponse(rs.getLong("id"), rs.getLong("sender_id"),
                rs.getString("sender_name"), rs.getString("body"), local(rs.getTimestamp("created_at")),
                rs.getLong("sender_id") == userId), productId, userId, peerId, peerId, userId);
    }

    @Transactional
    public MessageResponse send(long userId, long productId, long peerId, SendMessageRequest request) {
        long ownerId = requireProductOwner(productId);
        requireParticipants(userId, productId, ownerId, peerId);
        String body = request.body().trim();
        if (body.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tin nhắn không được để trống.");
        if (body.length() > 2000) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tin nhắn tối đa 2.000 ký tự.");
        Long id = jdbc.queryForObject("""
                INSERT INTO owner_product_messages(product_id,sender_id,receiver_id,body)
                VALUES(?,?,?,?) RETURNING id
                """, Long.class, productId, userId, peerId, body);
        String title = userId == ownerId ? "Tin nhắn mới từ Owner" : "Tin nhắn mới về sản phẩm";
        String target = userId == ownerId ? "/products/" + productId : "/owner/messages";
        jdbc.update("""
                INSERT INTO user_notifications(user_id,type,title,message,target_url)
                VALUES(?,'CHAT',?,?,?)
                """, peerId, title, body, target);
        return jdbc.queryForObject("""
                SELECT m.id,m.sender_id,COALESCE(u.full_name,u.email,'Người dùng') sender_name,
                       m.body,m.created_at
                FROM owner_product_messages m JOIN users u ON u.id=m.sender_id WHERE m.id=?
                """, (rs, n) -> new MessageResponse(rs.getLong("id"), rs.getLong("sender_id"),
                rs.getString("sender_name"), rs.getString("body"), local(rs.getTimestamp("created_at")), true), id);
    }

    private long requireProductOwner(long productId) {
        List<Long> owners = jdbc.query("SELECT owner_id FROM products WHERE id=?",
                (rs, n) -> rs.getLong(1), productId);
        if (owners.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy sản phẩm đang hoạt động.");
        return owners.get(0);
    }

    private void requireParticipants(long userId, long productId, long ownerId, long peerId) {
        if (userId == ownerId) {
            if (peerId == ownerId) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không thể nhắn tin với chính mình.");
            Integer exists = jdbc.queryForObject("""
                    SELECT COUNT(*) FROM owner_product_messages
                    WHERE product_id=? AND ((sender_id=? AND receiver_id=?) OR (sender_id=? AND receiver_id=?))
                    """, Integer.class, productId, ownerId, peerId, peerId, ownerId);
            if (exists == null || exists == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy cuộc trò chuyện.");
        } else {
            if (peerId != ownerId) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy cuộc trò chuyện.");
            Integer existing = jdbc.queryForObject("""
                    SELECT COUNT(*) FROM owner_product_messages
                    WHERE product_id=? AND ((sender_id=? AND receiver_id=?) OR (sender_id=? AND receiver_id=?))
                    """, Integer.class, productId, userId, ownerId, ownerId, userId);
            Integer activeProduct = jdbc.queryForObject("SELECT COUNT(*) FROM products WHERE id=? AND owner_id=? AND status='ACTIVE'",
                    Integer.class, productId, ownerId);
            if ((existing == null || existing == 0) && (activeProduct == null || activeProduct == 0))
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Sản phẩm này không còn nhận tin nhắn mới.");
        }
    }

    private LocalDateTime local(Timestamp value) {
        return value == null ? null : value.toLocalDateTime();
    }
}
