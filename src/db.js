const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');
const { storageDir } = require('./config');

fs.mkdirSync(storageDir(), { recursive: true });
const db = new Database(path.join(storageDir(), 'index.sqlite'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  source_path TEXT,
  size INTEGER NOT NULL,
  chunk_size INTEGER NOT NULL,
  total_chunks INTEGER NOT NULL,
  sha256 TEXT NOT NULL,
  state TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS chunks (
  file_id TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  size INTEGER NOT NULL,
  sha256 TEXT NOT NULL,
  state TEXT NOT NULL,
  telegram_message_id INTEGER,
  telegram_file_id TEXT,
  error TEXT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(file_id, chunk_index)
);
CREATE INDEX IF NOT EXISTS idx_chunks_state ON chunks(state);
`);

const insertFile = db.prepare(`INSERT INTO files
  (id,name,source_path,size,chunk_size,total_chunks,sha256,state,created_at,updated_at)
  VALUES (@id,@name,@source_path,@size,@chunk_size,@total_chunks,@sha256,@state,@created_at,@updated_at)`);
const insertChunk = db.prepare(`INSERT INTO chunks
  (file_id,chunk_index,size,sha256,state,updated_at)
  VALUES (@file_id,@chunk_index,@size,@sha256,'pending',@updated_at)`);

module.exports = {
  db,
  createFile(file, chunks) {
    db.transaction(() => {
      insertFile.run(file);
      for (const chunk of chunks) insertChunk.run(chunk);
    })();
  },
  getFile: id => db.prepare('SELECT * FROM files WHERE id = ?').get(id),
  listFiles: () => db.prepare('SELECT * FROM files ORDER BY created_at DESC').all(),
  getChunks: id => db.prepare('SELECT * FROM chunks WHERE file_id = ? ORDER BY chunk_index').all(id),
  setChunk(fileId, index, state, messageId = null, telegramFileId = null, error = null) {
    db.prepare(`UPDATE chunks SET state=?, telegram_message_id=?, telegram_file_id=?,
      error=?, updated_at=? WHERE file_id=? AND chunk_index=?`)
      .run(state, messageId, telegramFileId, error, new Date().toISOString(), fileId, index);
  },
  setFileState(id, state) {
    db.prepare('UPDATE files SET state=?, updated_at=? WHERE id=?')
      .run(state, new Date().toISOString(), id);
  },
  markUncertain(fileId, index, error) {
    db.prepare(`UPDATE chunks SET state='uncertain', error=?, updated_at=?
      WHERE file_id=? AND chunk_index=? AND state='uploading'`)
      .run(String(error), new Date().toISOString(), fileId, index);
  },
  pendingChunks: id => db.prepare(`SELECT * FROM chunks WHERE file_id=? AND state='pending' ORDER BY chunk_index`).all(id)
};
