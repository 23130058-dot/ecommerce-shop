package com.example.ecommerceshop.admin;

import com.example.ecommerceshop.admin.AdminReviewDtos.ReviewPage;
import com.example.ecommerceshop.admin.AdminReviewDtos.SentimentUpdateRequest;
import com.example.ecommerceshop.admin.AdminReviewDtos.VisibilityUpdateRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/reviews")
public class AdminReviewController {
    private final AdminReviewService service;
    public AdminReviewController(AdminReviewService service) { this.service = service; }

    @GetMapping
    public ReviewPage list(@RequestParam(required = false) String search,
                           @RequestParam(defaultValue = "all") String sentiment,
                           @RequestParam(defaultValue = "all") String status,
                           @RequestParam(defaultValue = "0") int page,
                           @RequestParam(defaultValue = "25") int size) {
        return service.list(search, sentiment, status, page, size);
    }

    @PatchMapping("/{id}/sentiment")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateSentiment(@PathVariable long id, @Valid @RequestBody SentimentUpdateRequest request) {
        service.updateSentiment(id, request.sentiment());
    }

    @PatchMapping("/{id}/visibility")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateVisibility(@PathVariable long id, @Valid @RequestBody VisibilityUpdateRequest request) {
        service.updateVisibility(id, request.status());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable long id) { service.delete(id); }
}
