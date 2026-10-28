package com.example.ecommerceshop.catalog;

import java.math.BigDecimal;

public interface CatalogProductDetailProjection {
    Long getId();
    String getName();
    String getType();
    String getCategory();
    String getCategoryName();
    String getBrand();
    String getDescription();
    BigDecimal getRating();
    String getTags();
    BigDecimal getPrice();
    BigDecimal getDepositAmount();
    String getImageKey();
    String getOwnerName();
    Long getOwnerId();
    String getStoreName();
    Integer getStock();
}
