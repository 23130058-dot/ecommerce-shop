-- Demo renter/owner account used by the project team to manage catalog products.
-- Keep existing profile and password data when this email already exists locally.
INSERT INTO users (full_name, email, password_hash, role, status, created_at)
VALUES (
    'Trần Văn A',
    '23130058@st.hcmuaf.edu.vn',
    '$2a$10$5vfEddQ9cFtkBm/CGHNPCeSRkgkD5uL4yef21KUVi1A.Je1vIDoPK',
    'USER',
    'ACTIVE',
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING;

-- Normal user accounts use the USER role; ADMIN remains reserved for admins.
UPDATE users
SET role = 'USER'
WHERE LOWER(email) = '23130058@st.hcmuaf.edu.vn'
  AND UPPER(COALESCE(role, '')) <> 'ADMIN';

-- V9 may have run before this account was seeded, so assign the demo products now.
UPDATE products
SET owner_id = (
    SELECT id
    FROM users
    WHERE LOWER(email) = '23130058@st.hcmuaf.edu.vn'
)
WHERE owner_id IN (
    SELECT id
    FROM users
    WHERE LOWER(email) = 'catalog@lensrent.local'
);
