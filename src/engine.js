const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const db = require('./db');
const { uploadDocument, downloadFile } = require('./telegram');
const { chunkSize } = require('./config');

const hashBuffer = buffer => crypto.createHash('sha256').update(buffer).digest('hex');

async function hashFile(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', data => hash.update(data));
    stream.on('error', reject);
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

async function uploadFile(sourcePath) {
  const absolute = path.resolve(sourcePath);
  const stat = await fsp.stat(absolute);
  if (!stat.isFile()) throw new Error('Source must be a regular file.');
  const totalChunks = Math.ceil(stat.size / chunkSize);
  const fileId = `f_${crypto.randomUUID().replaceAll('-', '')}`;
  const wholeHash = await hashFile(absolute);
  const now = new Date().toISOString();
  const chunks = [];
  const handle = await fsp.open(absolute, 'r');

  try {
    for (let i = 0; i < totalChunks; i++) {
      const size = Math.min(chunkSize, stat.size - i * chunkSize);
      const buffer = Buffer.alloc(size);
      const { bytesRead } = await handle.read(buffer, 0, size, i * chunkSize);
      if (bytesRead !== size) throw new Error(`Source changed while reading chunk ${i}.`);
      chunks.push({ file_id: fileId, chunk_index: i, size, sha256: hashBuffer(buffer), updated_at: now });
    }
  } finally {
    await handle.close();
  }

  db.createFile({
    id: fileId, name: path.basename(absolute), source_path: absolute,
    size: stat.size, chunk_size: chunkSize, total_chunks: totalChunks,
    sha256: wholeHash, state: 'uploading', created_at: now, updated_at: now
  }, chunks);

  console.log(`Created ${fileId}: ${stat.size} bytes, ${totalChunks} chunks.`);
  await uploadPending(fileId);
  return fileId;
}

async function uploadPending(fileId) {
  const file = db.getFile(fileId);
  if (!file) throw new Error(`Unknown file ID: ${fileId}`);
  if (!fs.existsSync(file.source_path)) {
    db.setFileState(fileId, 'source_missing');
    throw new Error(`Original source is missing: ${file.source_path}`);
  }

  const handle = await fsp.open(file.source_path, 'r');
  try {
    for (const chunk of db.pendingChunks(fileId)) {
      const buffer = Buffer.alloc(chunk.size);
      const { bytesRead } = await handle.read(buffer, 0, chunk.size, chunk.chunk_index * file.chunk_size);
      if (bytesRead !== chunk.size || hashBuffer(buffer) !== chunk.sha256) {
        db.setFileState(fileId, 'source_changed');
        throw new Error(`Source file changed; chunk ${chunk.chunk_index} no longer matches.`);
      }

      db.setChunk(fileId, chunk.chunk_index, 'uploading');
      try {
        const caption = `TGS1 ${fileId} ${chunk.chunk_index} ${chunk.sha256}`;
        const result = await uploadDocument(buffer, `${file.id}.part${String(chunk.chunk_index).padStart(6, '0')}`, caption);
        const telegramFileId = result.document?.file_id;
        if (!telegramFileId) throw new Error('Telegram response lacked document.file_id');
        db.setChunk(fileId, chunk.chunk_index, 'stored', result.message_id, telegramFileId);
        console.log(`Uploaded ${chunk.chunk_index + 1}/${file.total_chunks}`);
      } catch (error) {
        db.markUncertain(fileId, chunk.chunk_index, error.message);
        db.setFileState(fileId, 'needs_reconciliation');
        throw new Error(`Chunk ${chunk.chunk_index} is uncertain; not retrying automatically: ${error.message}`);
      }
    }
  } finally {
    await handle.close();
  }

  const incomplete = db.getChunks(fileId).some(chunk => chunk.state !== 'stored');
  db.setFileState(fileId, incomplete ? 'incomplete' : 'completed');
  return fileId;
}

async function downloadFileToPath(fileId, outputPath) {
  const file = db.getFile(fileId);
  if (!file) throw new Error(`Unknown file ID: ${fileId}`);
  const chunks = db.getChunks(fileId);
  if (chunks.length !== file.total_chunks) throw new Error('Manifest has missing chunk records.');
  if (chunks.some(c => c.state !== 'stored' || !c.telegram_file_id)) {
    throw new Error('File has chunks that are not confirmed stored.');
  }

  const target = path.resolve(outputPath || file.name);
  const temp = `${target}.part`;
  await fsp.mkdir(path.dirname(target), { recursive: true });
  const output = await fsp.open(temp, 'w');
  const wholeHash = crypto.createHash('sha256');

  try {
    for (const chunk of chunks) {
      const buffer = await downloadFile(chunk.telegram_file_id);
      if (buffer.length !== chunk.size) throw new Error(`Chunk ${chunk.chunk_index}: size mismatch.`);
      if (hashBuffer(buffer) !== chunk.sha256) throw new Error(`Chunk ${chunk.chunk_index}: SHA-256 mismatch.`);
      wholeHash.update(buffer);
      await output.write(buffer, 0, buffer.length, chunk.chunk_index * file.chunk_size);
      console.log(`Downloaded ${chunk.chunk_index + 1}/${file.total_chunks}`);
    }
    await output.sync();
  } catch (error) {
    await output.close();
    throw error;
  }
  await output.close();

  if (wholeHash.digest('hex') !== file.sha256) throw new Error('Whole-file SHA-256 mismatch; temporary output retained.');
  await fsp.rename(temp, target);
  console.log(`Verified and reconstructed: ${target}`);
  return target;
}

async function recover(fileId) {
  const files = fileId ? [db.getFile(fileId)].filter(Boolean) : db.listFiles();
  for (const file of files) {
    const chunks = db.getChunks(file.id);
    const uncertain = chunks.filter(c => ['uncertain', 'uploading'].includes(c.state));
    if (uncertain.length) {
      console.log(`${file.id}: ${uncertain.length} uncertain chunk(s); manual reconciliation required.`);
      continue;
    }
    if (chunks.some(c => c.state === 'pending')) {
      console.log(`${file.id}: resuming known-pending chunks.`);
      await uploadPending(file.id);
    } else if (chunks.every(c => c.state === 'stored')) {
      db.setFileState(file.id, 'completed');
      console.log(`${file.id}: all chunks confirmed stored.`);
    } else {
      console.log(`${file.id}: state ${file.state}; inspect with status.`);
    }
  }
}

module.exports = { uploadFile, downloadFileToPath, recover, hashFile };
