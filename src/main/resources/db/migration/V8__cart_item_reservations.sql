ALTER TABLE cart_items
    ADD COLUMN IF NOT EXISTS reserved_until TIMESTAMP;

UPDATE cart_items
SET reserved_until = CURRENT_TIMESTAMP + INTERVAL '10 minutes'
WHERE reserved_until IS NULL;

ALTER TABLE cart_items
    ALTER COLUMN reserved_until SET DEFAULT (CURRENT_TIMESTAMP + INTERVAL '10 minutes'),
    ALTER COLUMN reserved_until SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cart_items_product_reserved_until
    ON cart_items (product_id, reserved_until);
