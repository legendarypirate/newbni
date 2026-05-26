-- Business opportunities (from legacy sql/add_business_opportunities.sql), PostgreSQL.
CREATE TABLE IF NOT EXISTS bni_business_opportunities (
    id                  BIGSERIAL PRIMARY KEY,
    author_account_id   BIGINT       NOT NULL,
    title               VARCHAR(255) NOT NULL,
    summary             TEXT         NOT NULL,
    body                TEXT,
    opportunity_type    VARCHAR(32)  NOT NULL DEFAULT 'collaboration',
    context_type        VARCHAR(32)  NOT NULL DEFAULT 'none',
    context_id          BIGINT,
    status              VARCHAR(16)  NOT NULL DEFAULT 'open',
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_bni_opp_author ON bni_business_opportunities (author_account_id);
CREATE INDEX IF NOT EXISTS ix_bni_opp_type_status ON bni_business_opportunities (opportunity_type, status);
CREATE INDEX IF NOT EXISTS ix_bni_opp_context ON bni_business_opportunities (context_type, context_id);

CREATE TABLE IF NOT EXISTS bni_business_opportunity_applications (
    id                   BIGSERIAL PRIMARY KEY,
    opportunity_id       BIGINT       NOT NULL REFERENCES bni_business_opportunities (id) ON DELETE CASCADE,
    applicant_account_id BIGINT       NOT NULL,
    message              TEXT         NOT NULL,
    status               VARCHAR(16)  NOT NULL DEFAULT 'pending',
    response_note        TEXT,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_bni_opp_app_one_per_member UNIQUE (opportunity_id, applicant_account_id)
);

CREATE INDEX IF NOT EXISTS ix_bni_opp_app_applicant ON bni_business_opportunity_applications (applicant_account_id);
CREATE INDEX IF NOT EXISTS ix_bni_opp_app_status ON bni_business_opportunity_applications (status);
