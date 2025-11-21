-- Performance Optimization: Add Database Indexes
-- This will significantly improve query performance as data grows

-- Index on recruiter_id for filtering recruits by recruiter
CREATE INDEX IF NOT EXISTS idx_recruits_recruiter_id ON recruits(recruiter_id);

-- Index on source for filtering by QR code vs direct entries
CREATE INDEX IF NOT EXISTS idx_recruits_source ON recruits(source);

-- Index on submitted_at for sorting by date (most recent first)
CREATE INDEX IF NOT EXISTS idx_recruits_submitted_at ON recruits(submitted_at DESC);

-- Composite index for common stats query pattern (recruiter_id + source)
CREATE INDEX IF NOT EXISTS idx_recruits_recruiter_source ON recruits(recruiter_id, source);

-- Index on qr_code for fast recruiter lookups
CREATE INDEX IF NOT EXISTS idx_users_qr_code ON users(qr_code);

-- Index on recruiter_id for survey responses
CREATE INDEX IF NOT EXISTS idx_qr_survey_responses_recruiter_id ON qr_survey_responses(recruiter_id);

-- Index on created_at for survey responses sorting
CREATE INDEX IF NOT EXISTS idx_qr_survey_responses_created_at ON qr_survey_responses(created_at DESC);

