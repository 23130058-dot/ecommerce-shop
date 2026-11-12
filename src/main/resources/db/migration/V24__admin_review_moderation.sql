ALTER TABLE product_reviews
    ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(16) NOT NULL DEFAULT 'VISIBLE',
    ADD COLUMN IF NOT EXISTS sentiment_source VARCHAR(12) NOT NULL DEFAULT 'MODEL';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_product_reviews_moderation_status') THEN
        ALTER TABLE product_reviews ADD CONSTRAINT ck_product_reviews_moderation_status
            CHECK (moderation_status IN ('VISIBLE', 'HIDDEN'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_product_reviews_sentiment_source') THEN
        ALTER TABLE product_reviews ADD CONSTRAINT ck_product_reviews_sentiment_source
            CHECK (sentiment_source IN ('MODEL', 'ADMIN'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_product_reviews_sentiment_status
    ON product_reviews (sentiment, moderation_status, created_at DESC);
