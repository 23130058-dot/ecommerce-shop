package com.example.ecommerceshop.catalog;

import com.example.ecommerceshop.catalog.CatalogDtos.ProductResponse;
import com.example.ecommerceshop.catalog.CatalogDtos.ProductDetailResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class CatalogController {
    private final CatalogService catalogService;

    public CatalogController(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @GetMapping
    public List<ProductResponse> products(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "popular") String sort,
            @RequestParam(defaultValue = "12") int limit
    ) {
        return catalogService.getProducts(search, category, sort, limit);
    }

    @GetMapping("/{productId}")
    public ProductDetailResponse product(@PathVariable long productId) {
        return catalogService.getProduct(productId);
    }
}
