package com.example.ecommerceshop.catalog;

import java.math.BigDecimal;

public interface CatalogProductProjection {
    Long getId();
    String getName();
    String getType();
    String getCategory();
    String getBrand();
    BigDecimal getRating();
    String getTags();
    BigDecimal getPrice();
    String getImageKey();
    Integer getStock();
}
