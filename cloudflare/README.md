# Cloudflare deployment

This is the Cloudflare Workers adapter for Telegram-sapi. It uses **Workers + D1** and talks directly to the Telegram Bot API. It deliberately does not require a local filesystem or a running Node.js process.

## Provisioned resources

- Worker: `telegram-sapi`
- D1 database: `telegram-sapi-db`
- D1 binding: `DB`
- D1 database ID: `e7631229-9ad7-45c0-9683-3cd2fe74cc8a`
- Worker URL: `https://telegram-sapi.oprangerx.workers.dev`

R2 is optional for the current 10 MiB direct-to-Telegram upload design. The connected Cloudflare account currently requires R2 to be enabled in the Cloudflare Dashboard before buckets can be created; the Worker does not depend on it.

## Required secrets

The Worker already has an automatically generated `API_TOKEN` secret. Set the two Telegram secrets before using file endpoints:

```sh
npx wrangler secret put TELEGRAM_BOT_TOKEN --name telegram-sapi
npx wrangler secret put TELEGRAM_CHAT_ID --name telegram-sapi
```

Alternatively, in Cloudflare Dashboard open **Workers & Pages → telegram-sapi → Settings → Variables and Secrets** and add both as encrypted secrets.

Do not commit secrets or paste them into source files.

## API

All endpoints except `GET /health` require:

```
Authorization: Bearer <API_TOKEN>
```

- `GET /health` — public health check.
- `POST /v1/files` — create a file manifest. JSON: `{"filename":"archive.zip","size":123456,"sha256":"optional-64-char-hex"}`. Returns a file ID and chunk count.
- `GET /v1/files/:id` — retrieve file metadata and chunk states.
- `PUT /v1/files/:id/chunks/:index` — upload exactly the expected chunk bytes as the raw request body. Chunk size is 10 MiB except the final chunk.
- `GET /v1/files/:id/chunks/:index` — download and SHA-256 verify one chunk. The client assembles chunks in index order.

Example:

```sh
curl -X POST https://telegram-sapi.oprangerx.workers.dev/v1/files \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"filename":"hello.bin","size":5}'

curl -X PUT "https://telegram-sapi.oprangerx.workers.dev/v1/files/FILE_ID/chunks/0" \
  -H "Authorization: Bearer $API_TOKEN" \
  --data-binary @chunk-0.bin
```

## Safety and current scope

- Telegram is the byte store; D1 stores manifests, hashes, Telegram file IDs, message IDs, and states.
- Upload chunks sequentially or with low concurrency. A Telegram network timeout after sending is marked `uncertain`; the API refuses a blind retry to avoid duplicate Telegram documents.
- A definite Telegram API rejection returns the chunk to `pending`.
- Each downloaded chunk is checked against its stored size and SHA-256.
- The current adapter exposes per-chunk download; clients merge chunks locally and verify the whole-file hash.
- A complete end-to-end upload requires the Telegram bot to be an administrator in the destination channel with permission to post documents.
- Do not treat Telegram as the only backup of important files.

## Development

The Worker source is `src/index.js`; D1 schema is `schema.sql`. The Node.js CLI in the repository remains a separate deployment mode.
