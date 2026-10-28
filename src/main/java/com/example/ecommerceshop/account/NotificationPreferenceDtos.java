package com.example.ecommerceshop.account;

import jakarta.validation.constraints.NotNull;

import java.time.LocalTime;

public final class NotificationPreferenceDtos {
    private NotificationPreferenceDtos() {}

    public record PreferencesResponse(boolean inAppEnabled, boolean emailEnabled, boolean returnReminders,
                                     boolean orderUpdates, boolean paymentUpdates, boolean disputes,
                                     boolean productRecommendations, boolean promotions,
                                     boolean quietHoursEnabled, LocalTime quietStart, LocalTime quietEnd) {}

    public record PreferencesRequest(@NotNull Boolean inAppEnabled, @NotNull Boolean emailEnabled,
                                     @NotNull Boolean returnReminders, @NotNull Boolean orderUpdates,
                                     @NotNull Boolean paymentUpdates, @NotNull Boolean disputes,
                                     @NotNull Boolean productRecommendations, @NotNull Boolean promotions,
                                     @NotNull Boolean quietHoursEnabled, @NotNull LocalTime quietStart,
                                     @NotNull LocalTime quietEnd) {}
}
