ALTER TABLE rentals
    ADD COLUMN IF NOT EXISTS service_fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS delivery_method VARCHAR(30),
    ADD COLUMN IF NOT EXISTS delivery_address VARCHAR(500),
    ADD COLUMN IF NOT EXISTS district VARCHAR(120),
    ADD COLUMN IF NOT EXISTS city VARCHAR(120),
    ADD COLUMN IF NOT EXISTS contact_name VARCHAR(160),
    ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(40),
    ADD COLUMN IF NOT EXISTS contact_email VARCHAR(254);

CREATE INDEX IF NOT EXISTS idx_rentals_renter_created
    ON rentals (renter_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rental_items_rental
    ON rental_items (rental_id, id);
