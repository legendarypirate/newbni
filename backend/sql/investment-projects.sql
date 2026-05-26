-- Fundraising / investment projects shown on /investments (not business_trips).
CREATE TABLE IF NOT EXISTS investment_projects (
    id               SERIAL PRIMARY KEY,
    title            VARCHAR(512)  NOT NULL,
    slug             VARCHAR(512),
    sector           VARCHAR(255),
    excerpt          TEXT,
    description      TEXT,
    cover_image_url  VARCHAR(512),
    target_mnt       NUMERIC(14, 2),
    raised_percent   INTEGER       NOT NULL DEFAULT 0,
    stage            VARCHAR(64),
    location         VARCHAR(255),
    status           VARCHAR(32)   NOT NULL DEFAULT 'draft',
    status_label     VARCHAR(255),
    is_featured      INTEGER       NOT NULL DEFAULT 0,
    owner_account_id BIGINT,
    published_at     TIMESTAMPTZ,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS investment_projects_status_idx
    ON investment_projects (status);

CREATE INDEX IF NOT EXISTS investment_projects_featured_idx
    ON investment_projects (is_featured DESC, published_at DESC);
