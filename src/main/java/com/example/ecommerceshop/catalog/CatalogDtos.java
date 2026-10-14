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
            BigDecimal rating,
            List<String> tags,
            BigDecimal price,
            String imageKey,
            String status
    ) {
    }
}