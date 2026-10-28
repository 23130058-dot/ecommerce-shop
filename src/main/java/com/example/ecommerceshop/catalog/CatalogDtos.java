package com.example.ecommerceshop.catalog;

import java.math.BigDecimal;
import java.util.List;

public final class CatalogDtos {
    private CatalogDtos() {
    }

    public record ProductResponse(
            Long id,
            String name,
            String type,
            String category,
            String brand,
            BigDecimal rating,
            List<String> tags,
            BigDecimal price,
            String imageKey,
            String status
    ) {
    }

    public record ProductDetailResponse(
            Long id,
            String name,
            String type,
            String category,
            String categoryName,
            String brand,
            String description,
            BigDecimal rating,
            List<String> tags,
            BigDecimal price,
            BigDecimal depositAmount,
            String imageKey,
            List<String> images,
            String ownerName,
            Long ownerId,
            String storeName,
            int availableQuantity,
            String status
    ) {
    }
}
