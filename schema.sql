CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        device_id TEXT UNIQUE NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE channels (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        slug TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        track INTEGER CHECK (track IN (1, 2) OR track IS NULL),
        team_id_1 SMALLINT CHECK (team_id_1 BETWEEN 1 AND 50),
        team_id_2 SMALLINT CHECK (team_id_2 BETWEEN 1 AND 50),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (user_id, channel_id)
    );

    CREATE TABLE push_subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        endpoint TEXT NOT NULL UNIQUE,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        data JSONB DEFAULT '{}'::jsonb,
        scheduled_at TIMESTAMPTZ,  -- null = envoyer maintenant
        sent_at TIMESTAMPTZ,       -- null = pas encore envoyée
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE notification_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        status TEXT NOT NULL, -- 'success' ou 'failed'
        error TEXT
    );

    -- USERS
    CREATE UNIQUE INDEX idx_users_device_id ON users(device_id);

    -- CHANNELS
    CREATE UNIQUE INDEX idx_channels_slug ON channels(slug);

    -- SUBSCRIPTIONS
    CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
    CREATE INDEX idx_subscriptions_channel_id ON subscriptions(channel_id);

    -- PUSH SUBSCRIPTIONS
    CREATE UNIQUE INDEX idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);
    CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);

    -- NOTIFICATIONS
    CREATE INDEX idx_notifications_scheduled_at ON notifications(scheduled_at);
    CREATE INDEX idx_notifications_sent_at ON notifications(sent_at);
    CREATE INDEX idx_notifications_channel_id ON notifications(channel_id);

    -- NOTIFICATION LOGS (optionnel)
    CREATE INDEX idx_notification_logs_notification_id ON notification_logs(notification_id);
    CREATE INDEX idx_notification_logs_user_id ON notification_logs(user_id);
