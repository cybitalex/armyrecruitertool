-- Migration 013: PII Audit Log
-- Tracks all access to PII-bearing endpoints per Privacy Act of 1974 / AR 25-22.
-- Retained for 2 years (pilot evaluation period) then eligible for purge per records schedule.

CREATE TABLE IF NOT EXISTS pii_audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_time  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name   TEXT,                        -- snapshot of name at access time
  ip_address  TEXT,
  method      TEXT NOT NULL,               -- GET / POST / PUT / DELETE
  endpoint    TEXT NOT NULL,               -- path, no query params
  action      TEXT NOT NULL,               -- e.g. "VIEW_RECRUIT", "EXPORT_CONTACTS"
  record_id   TEXT,                        -- UUID of the accessed record (if applicable)
  status_code INTEGER,
  user_agent  TEXT
);

CREATE INDEX IF NOT EXISTS idx_pii_audit_user    ON pii_audit_log (user_id);
CREATE INDEX IF NOT EXISTS idx_pii_audit_time    ON pii_audit_log (event_time DESC);
CREATE INDEX IF NOT EXISTS idx_pii_audit_action  ON pii_audit_log (action);
