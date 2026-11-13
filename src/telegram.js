const { botToken, chatId } = require('./config');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function requestJson(method, form) {
  const url = `https://api.telegram.org/bot${botToken()}/${method}`;
  for (let attempt = 0; attempt < 6; attempt++) {
    const response = await fetch(url, { method: 'POST', body: form });
    const body = await response.json().catch(() => ({}));
    if (response.ok && body.ok) return body.result;
    const retryAfter = body?.parameters?.retry_after;
    if (response.status === 429 && retryAfter && attempt < 5) {
      await sleep((retryAfter + 1) * 1000);
      continue;
    }
    throw new Error(`Telegram ${method} failed (${response.status}): ${body.description || 'Unknown error'}`);
  }
  throw new Error(`Telegram ${method}: retry limit exceeded`);
}

async function uploadDocument(buffer, filename, caption) {
  const form = new FormData();
  form.append('chat_id', chatId());
  form.append('caption', caption);
  form.append('document', new Blob([buffer]), filename);
  return requestJson('sendDocument', form);
}

async function getDownloadUrl(fileId) {
  const form = new FormData();
  form.append('file_id', fileId);
  const result = await requestJson('getFile', form);
  return `https://api.telegram.org/file/bot${botToken()}/${result.file_path}`;
}

async function downloadFile(fileId) {
  const response = await fetch(await getDownloadUrl(fileId));
  if (!response.ok) throw new Error(`Telegram file download failed: HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

module.exports = { uploadDocument, downloadFile };
