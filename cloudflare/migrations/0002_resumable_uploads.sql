-- Resumable upload matching and inactivity expiry (24 hours).
ALTER TABLE files ADD COLUMN fingerprint TEXT;
ALTER TABLE files ADD COLUMN expires_at TEXT;
CREATE INDEX IF NOT EXISTS idx_files_fingerprint ON files(fingerprint, size_bytes, status);
CREATE INDEX IF NOT EXISTS idx_files_expiry ON files(status, expires_at);
