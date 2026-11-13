# Telegram-sapi

**Telegram-sapi** is an experimental, chunked file-storage engine that uses a Telegram channel as the byte store and SQLite as the local metadata index.

The first milestone is a Node.js CLI built directly on Telegram's HTTP Bot API. It splits files into **10 MiB chunks**, uploads each chunk as a Telegram document, records the returned Telegram file reference in SQLite, and reconstructs files with SHA-256 verification.

> **Status: v0.1 — early development.** The CLI storage core is scaffolded. Live Telegram integration tests have not yet been run. This is not a production backup service.

## Features in v0.1

- Split files into fixed **10 MiB** (10,485,760-byte) chunks.
- Upload chunks with Telegram Bot API `sendDocument`.
- Store file and chunk metadata in a local SQLite database.
- Download chunks using `getFile` and Telegram's file download endpoint.
- Verify each chunk and the reconstructed file with SHA-256.
- Keep an upload journal so known-pending chunks can be resumed.
- Handle Telegram HTTP 429 responses using `retry_after`.
- CLI commands for upload, download, status, and recovery.

## Architecture

```text
Local file
   |
   v
10 MiB chunker
   |
   v
Telegram Bot API -----> Private Telegram channel
   |                         stores chunk documents
   v
SQLite index
   stores file metadata, hashes, message IDs,
   Telegram file IDs, and upload states

Download:
SQLite manifest -> Telegram getFile -> chunk downloads
                 -> SHA-256 checks -> ordered merge
                 -> whole-file SHA-256 check
```

Telegram stores the chunk bytes. SQLite stores the mapping needed to find and reconstruct them. The SQLite database is local to the machine running the CLI.

## Requirements

- Node.js **20 or newer** (Node.js 22 recommended).
- A Telegram bot token.
- A private Telegram channel.
- The bot must be added as a channel administrator with permission to post messages.
- The channel ID, usually in the form `-100...`.

A 10 MiB chunk is below the standard cloud Bot API's documented 50 MB upload and 20 MB download limits.

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/kingmackpro/Telegram-sapi.git
cd Telegram-sapi
npm install
```

Set the environment variables before running commands.

### Linux / macOS

```bash
export TELEGRAM_BOT_TOKEN="YOUR_BOT_TOKEN"
export TELEGRAM_CHAT_ID="-1001234567890"
# Optional; defaults to ./.data
export STORAGE_DIR="./.data"
```

### Windows PowerShell

```powershell
$env:TELEGRAM_BOT_TOKEN = "YOUR_BOT_TOKEN"
$env:TELEGRAM_CHAT_ID = "-1001234567890"
$env:STORAGE_DIR = ".\.data"
```

Do not commit your bot token. The included `.env.example` is a reference template; v0.1 reads environment variables directly and does not automatically load a `.env` file.

## CLI usage

### Upload a file

```bash
node src/index.js upload ./large-file.zip
``

The command prints a generated file ID after the upload completes, for example:

```text
FILE_ID=f_...
``

Keep this ID: it is used to retrieve the file later.

### List indexed files / inspect status

```bash
node src/index.js status
node src/index.js status f_YOUR_FILE_ID
``

### Download and reconstruct

```bash
node src/index.js download f_YOUR_FILE_ID ./restored-file.zip
``

Chunks are downloaded in index order. The engine checks each chunk's size and SHA-256, verifies the final file hash, and only then renames the temporary output file to the requested destination.

### Recover interrupted uploads

```bash
node src/index.js recover
node src/index.js recover f_YOUR_FILE_ID
``

Recovery resumes chunks known to be pending. It deliberately stops when a chunk is in an uncertain state rather than automatically uploading it again.

## Data and storage layout

By default, the local SQLite database is created at:

```text
.data/index.sqlite
```

Override its parent directory with `STORAGE_DIR`.

The database records:

- Logical file ID, filename, size, chunk size, total chunk count, and whole-file SHA-256.
- Chunk index, size, and SHA-256.
- Telegram message ID and Telegram `file_id` for confirmed uploads.
- Upload state and error information.

Back up the SQLite database. It contains the index that maps logical files to Telegram-stored chunks. Losing it can make previously uploaded files difficult or impossible to reconstruct.

## Recovery limitation

The standard Bot API does not offer a method to search a channel's complete message history or fetch an arbitrary channel message by message ID.

For example, Telegram may accept a chunk, but the network connection can fail before the bot receives the successful response. In that situation, the client cannot know whether the chunk was stored. v0.1 marks the chunk as `uncertain` and does not blindly retry, because that could create duplicate messages.

This is a deliberate safety trade-off. Full automatic reconciliation would require an additional mechanism beyond the standard Bot API, or a separately designed recovery protocol.

## Current limitations

- v0.1 is a local CLI, not yet a REST API, FTP server, or network filesystem.
- Downloads are sequential; parallel and resumable downloads are planned.
- The SQLite index is local, not synchronized between machines.
- Uncertain uploads require manual reconciliation.
- No live Telegram integration test has been completed yet.
- Telegram is a third-party service and may apply rate limits or change platform behavior.

Do not use this experimental project as the only copy of important data. Keep independent backups.

## Cloudflare Workers deployment

The Cloudflare implementation in [`cloudflare/`](./cloudflare/README.md) is a deployed chunked file-storage API built with Workers and D1. Telegram stores the chunk bytes; D1 stores file and chunk metadata. The browser UI and Node.js client use the API for chunked uploads and downloads, with SHA-256 verification. Incomplete uploads can be resumed while their 24-hour inactivity window remains active. Deleting a completed file archives its Telegram chunk references in D1, allowing an exact matching re-upload to restore the file metadata without uploading the bytes again. This recovery archive preserves references only; deletion does not remove the Telegram messages. Configure `API_TOKEN`, `TELEGRAM_BOT_TOKEN`, and `TELEGRAM_CHAT_ID` as encrypted Worker secrets. See [the Cloudflare guide](./cloudflare/README.md) for setup and API details.

## Roadmap

- [x] 10 MiB chunk format
- [x] Direct Bot API upload/download client
- [x] SQLite file and chunk index
- [x] Per-chunk and whole-file SHA-256 checks
- [x] Basic interrupted-upload journal
- [ ] Automated unit and integration tests
- [ ] Parallel downloads with configurable concurrency
- [ ] Resumable downloads with a persistent download journal
- [ ] Better reconciliation tools for uncertain uploads
- [ ] REST API and API-key authentication
- [ ] FTP-like filesystem interface

## License

No license has been selected yet. Until a license is added, all rights are reserved by the repository owner.
