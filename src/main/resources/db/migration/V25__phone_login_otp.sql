CREATE TABLE login_phone_codes (
    phone VARCHAR(30) PRIMARY KEY,
    code_hash VARCHAR(100) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_login_phone_codes_created_at ON login_phone_codes(created_at);
