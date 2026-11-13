const path = require('node:path');

const CHUNK_SIZE = 10 * 1024 * 1024;

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

module.exports = {
  botToken: () => required('TELEGRAM_BOT_TOKEN'),
  chatId: () => required('TELEGRAM_CHAT_ID'),
  storageDir: () => path.resolve(process.env.STORAGE_DIR || './.data'),
  chunkSize: CHUNK_SIZE
};
