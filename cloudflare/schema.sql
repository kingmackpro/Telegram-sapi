-- Telegram-sapi Cloudflare D1 schema
CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  size_bytes INTEGER NOT NULL CHECK(size_bytes >= 0),
  chunk_size INTEGER NOT NULL,
  total_chunks INTEGER NOT NULL,
  sha256 TEXT,
  status TEXT NOT NULL DEFAULT 'uploading',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS chunks (
  file_id TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  size_bytes INTEGER NOT NULL,
  sha256 TEXT,
  telegram_message_id INTEGER,
  telegram_file_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY(file_id, chunk_index)
);
CREATE INDEX IF NOT EXISTS idx_chunks_status ON chunks(file_id, status);

-- Preserve completed-file metadata and Telegram chunk references for instant recovery.
CREATE TABLE IF NOT EXISTS recovery_files (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  chunk_size INTEGER NOT NULL,
  total_chunks INTEGER NOT NULL,
  sha256 TEXT,
  status TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  archived_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_recovery_fingerprint ON recovery_files(fingerprint, size_bytes, filename, status);
CREATE TABLE IF NOT EXISTS recovery_chunks (
  file_id TEXT NOT NULL REFERENCES recovery_files(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  size_bytes INTEGER NOT NULL,
  sha256 TEXT,
  telegram_message_id INTEGER,
  telegram_file_id TEXT,
  status TEXT NOT NULL,
  error TEXT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(file_id, chunk_index)
);
