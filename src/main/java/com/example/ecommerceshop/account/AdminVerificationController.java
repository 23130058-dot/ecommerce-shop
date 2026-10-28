package com.example.ecommerceshop.account;

import com.example.ecommerceshop.account.VerificationDtos.AdminVerificationResponse;
import com.example.ecommerceshop.account.VerificationDtos.VerificationDocument;
import com.example.ecommerceshop.account.VerificationDtos.VerificationReviewRequest;
import jakarta.validation.Valid;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/admin/verifications")
public class AdminVerificationController {
    private final AccountVerificationService service;

    public AdminVerificationController(AccountVerificationService service) { this.service = service; }

    @GetMapping
    public List<AdminVerificationResponse> list(@RequestParam(required = false) String status) {
        return service.listForAdmin(status);
    }

    @GetMapping("/{userId}/documents/{type}")
    public ResponseEntity<byte[]> document(@PathVariable long userId, @PathVariable String type) {
        VerificationDocument document = service.adminDocument(userId, type);
        MediaType mediaType = MediaType.parseMediaType(document.contentType());
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(mediaType);
        headers.setContentDisposition(ContentDisposition.inline().filename(document.fileName(), StandardCharsets.UTF_8).build());
        headers.setCacheControl(CacheControl.noStore());
        headers.set("X-Content-Type-Options", "nosniff");
        return ResponseEntity.ok().headers(headers).body(document.content());
    }

    @PatchMapping("/{userId}/{type}")
    public ResponseEntity<Void> review(@AuthenticationPrincipal Jwt jwt, @PathVariable long userId,
                                       @PathVariable String type, @Valid @RequestBody VerificationReviewRequest request) {
        service.review(userId(jwt), userId, type, request);
        return ResponseEntity.noContent().build();
    }

    private long userId(Jwt jwt) {
        Object claim = jwt == null ? null : jwt.getClaim("userId");
        if (claim instanceof Number id) return id.longValue();
        throw new IllegalStateException("JWT không chứa userId hợp lệ.");
    }
}
