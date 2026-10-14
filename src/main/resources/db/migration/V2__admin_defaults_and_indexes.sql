UPDATE users SET role = 'RENTER' WHERE role IS NULL OR BTRIM(role) = '';
UPDATE users SET status = 'ACTIVE' WHERE status IS NULL OR BTRIM(status) = '';

ALTER TABLE users ALTER COLUMN role SET DEFAULT 'RENTER';
ALTER TABLE users ALTER COLUMN status SET DEFAULT 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_users_created_at ON users (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users (role, status);
CREATE INDEX IF NOT EXISTS idx_products_status_created_at ON products (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rentals_status_created_at ON rentals (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rentals_renter_id ON rentals (renter_id);
CREATE INDEX IF NOT EXISTS idx_payments_status_paid_at ON payments (status, paid_at DESC);
