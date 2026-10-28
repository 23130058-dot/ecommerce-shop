ALTER TABLE user_notification_preferences
    ADD COLUMN IF NOT EXISTS return_reminders BOOLEAN NOT NULL DEFAULT TRUE;

DROP TRIGGER IF EXISTS trg_lensrent_notification_preferences ON user_notifications;
DROP FUNCTION IF EXISTS lensrent_filter_user_notification();
