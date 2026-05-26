-- Per-user likes on public trips and events.
CREATE TABLE IF NOT EXISTS content_likes (
    id           BIGSERIAL PRIMARY KEY,
    account_id   BIGINT       NOT NULL,
    target_type  VARCHAR(16)  NOT NULL,
    target_id    VARCHAR(64)  NOT NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT content_likes_uniq UNIQUE (account_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS content_likes_target_idx
    ON content_likes (target_type, target_id);

CREATE INDEX IF NOT EXISTS content_likes_account_idx
    ON content_likes (account_id);
