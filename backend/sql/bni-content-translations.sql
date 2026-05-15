-- Cached UI/database field translations (MN source → en, cn, kr, jp).
CREATE TABLE IF NOT EXISTS bni_content_translations (
    id           BIGSERIAL PRIMARY KEY,
    entity_type  VARCHAR(64)  NOT NULL,
    entity_id    VARCHAR(64)  NOT NULL,
    field_name   VARCHAR(64)  NOT NULL,
    lang         VARCHAR(8)   NOT NULL,
    value        TEXT         NOT NULL,
    source_hash  VARCHAR(64),
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT bni_content_translations_uniq UNIQUE (entity_type, entity_id, field_name, lang)
);

CREATE INDEX IF NOT EXISTS bni_content_translations_entity_idx
    ON bni_content_translations (entity_type, entity_id);
