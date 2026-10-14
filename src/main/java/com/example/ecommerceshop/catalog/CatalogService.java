package com.example.ecommerceshop.catalog;

import com.example.ecommerceshop.catalog.CatalogDtos.ProductResponse;
import com.example.ecommerceshop.catalog.CatalogDtos.ProductDetailResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class CatalogService {
    private static final Set<String> SORT_OPTIONS = Set.of("popular", "newest", "price");
    private static final int MAX_PAGE_SIZE = 100;
    private final CatalogProductRepository productRepository;

    public CatalogService(CatalogProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getProducts(String search, String category, String sort, int limit) {
        String normalizedSearch = search == null ? "" : search.trim().toLowerCase(Locale.ROOT);
        String normalizedCategory = category == null ? "" : category.trim().toLowerCase(Locale.ROOT);
        String normalizedSort = sort == null ? "popular" : sort.trim().toLowerCase(Locale.ROOT);
        if (!SORT_OPTIONS.contains(normalizedSort)) normalizedSort = "popular";
        int safeLimit = Math.min(Math.max(limit, 1), MAX_PAGE_SIZE);

        return productRepository.searchCatalog(normalizedSearch, normalizedCategory, normalizedSort, safeLimit)
                .stream()
                .map(product -> new ProductResponse(
                        product.getId(),
                        product.getName(),
                        product.getType(),
                        product.getCategory(),
                        product.getBrand(),
                        product.getRating(),
                        parseTags(product.getTags()),
                        product.getPrice(),
                        product.getImageKey(),
                        product.getStock() != null && product.getStock() > 0 ? "Sẵn sàng" : "Đã thuê"
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public ProductDetailResponse getProduct(long id) {
        CatalogProductDetailProjection product = productRepository.findActiveProductDetail(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy thiết bị này."));
        int availableQuantity = product.getStock() == null ? 0 : Math.max(product.getStock(), 0);
        List<String> images = productRepository.findProductImages(id).stream()
                .filter(image -> image != null && !image.isBlank())
                .toList();
        if (images.isEmpty() && product.getImageKey() != null && !product.getImageKey().isBlank()) {
            images = List.of(product.getImageKey());
        }

        return new ProductDetailResponse(
                product.getId(),
                product.getName(),
                product.getType(),
                product.getCategory(),
                product.getCategoryName(),
                product.getBrand(),
                product.getDescription(),
                product.getRating(),
                parseTags(product.getTags()),
                product.getPrice(),
                product.getDepositAmount(),
                product.getImageKey(),
                images,
                product.getOwnerName(),
                availableQuantity,
                availableQuantity > 0 ? "Sẵn sàng" : "Đã thuê"
        );
    }

    private List<String> parseTags(String tags) {
        if (tags == null || tags.isBlank()) return List.of();
        return Arrays.stream(tags.split("\\|"))
                .map(String::trim)
                .filter(tag -> !tag.isEmpty())
                .toList();
    }
}
