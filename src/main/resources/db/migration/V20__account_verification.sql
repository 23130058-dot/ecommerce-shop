CREATE TABLE account_verifications (
    user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    verified_phone VARCHAR(30),
    phone_verified_at TIMESTAMP,
    student_card_status VARCHAR(24) NOT NULL DEFAULT 'NOT_SUBMITTED'
        CHECK (student_card_status IN ('NOT_SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED')),
    student_card_file_name VARCHAR(255),
    student_card_content_type VARCHAR(80),
    student_card_data BYTEA,
    student_card_submitted_at TIMESTAMP,
    student_card_review_note VARCHAR(1000),
    student_card_reviewed_at TIMESTAMP,
    student_card_reviewed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    identity_status VARCHAR(24) NOT NULL DEFAULT 'NOT_SUBMITTED'
        CHECK (identity_status IN ('NOT_SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED')),
    identity_file_name VARCHAR(255),
    identity_content_type VARCHAR(80),
    identity_data BYTEA,
    identity_submitted_at TIMESTAMP,
    identity_review_note VARCHAR(1000),
    identity_reviewed_at TIMESTAMP,
    identity_reviewed_by BIGINT REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_account_verifications_student_status ON account_verifications(student_card_status, student_card_submitted_at DESC);
CREATE INDEX idx_account_verifications_identity_status ON account_verifications(identity_status, identity_submitted_at DESC);

CREATE TABLE account_phone_verification_codes (
    user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    phone VARCHAR(30) NOT NULL,
    code_hash VARCHAR(100) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
