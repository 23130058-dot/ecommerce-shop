INSERT INTO users (full_name, email, password_hash, role, status, created_at)
VALUES (
    'LensRent Admin',
    '123@gmail.com',
    '$2a$10$5vfEddQ9cFtkBm/CGHNPCeSRkgkD5uL4yef21KUVi1A.Je1vIDoPK',
    'ADMIN',
    'ACTIVE',
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    role = 'ADMIN',
    status = 'ACTIVE';
