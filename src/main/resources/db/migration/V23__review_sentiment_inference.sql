ALTER TABLE product_reviews
    ADD COLUMN IF NOT EXISTS sentiment VARCHAR(12),
    ADD COLUMN IF NOT EXISTS sentiment_confidence NUMERIC(5,4);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ck_product_reviews_sentiment'
    ) THEN
        ALTER TABLE product_reviews
            ADD CONSTRAINT ck_product_reviews_sentiment
            CHECK (sentiment IS NULL OR sentiment IN ('POSITIVE', 'NEUTRAL', 'NEGATIVE'));
    END IF;
END $$;

DROP TABLE IF EXISTS sentiment_training_samples;
