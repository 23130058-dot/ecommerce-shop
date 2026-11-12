ALTER TABLE rental_items
    ADD COLUMN IF NOT EXISTS return_requested_date DATE;
