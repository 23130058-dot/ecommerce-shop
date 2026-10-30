
package com.example.ecommerceshop.owner;

import java.math.BigDecimal;

public interface OwnerProductProjection {
    Long getId();
    String getName();
    String getType();
    String getCategory();
    String getCategoryName();
    String getBrand();
    BigDecimal getDailyPrice();
    BigDecimal getDepositAmount();
    Integer getStock();
    String getStatus();
    String getImageKey();
}
