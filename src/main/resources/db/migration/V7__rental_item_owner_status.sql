ALTER TABLE rental_items
    ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'PENDING';

UPDATE rental_items ri
SET status = UPPER(COALESCE(r.status, 'PENDING'))
FROM rentals r
WHERE r.id = ri.rental_id
  AND UPPER(COALESCE(r.status, 'PENDING')) <> 'PENDING';
