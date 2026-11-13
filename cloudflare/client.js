#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const BASE = (process.env.CLOUDFLARE_WORKER_URL || "https://telegram-sapi.oprangerx.workers.dev").replace(/\/$/, "");
const TOKEN = process.env.API_TOKEN;
const CHUNK_SIZE = 10 * 1024 * 1024;

function fail(message) { console.error(message); process.exitCode = 1; }
async function api(route, options = {}) {
  if (!TOKEN) throw new Error("Set API_TOKEN in your local environment.");
  const response = await fetch(BASE + route, {
    ...options,
    headers: { Authorization: `Bearer ${TOKEN}`, ...(options.headers || {}) }
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API ${response.status}: ${text}`);
  }
  return response;
}
function hash(buffer) { return createHash("sha256").update(buffer).digest("hex"); }

async function upload(filePath) {
  const stat = fs.statSync(filePath);
  if (!stat.isFile()) throw new Error("Input must be a regular file.");
  const filename = path.basename(filePath);
  const fullHash = createHash("sha256");
  const fd = fs.openSync(filePath, "r");
  try {
    const manifest = await api("/v1/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename, size: stat.size, sha256: await hashFile(filePath) })
    }).then(r => r.json());
    console.log(`Created ${manifest.id}: ${manifest.totalChunks} chunks`);
    for (let i = 0; i < manifest.totalChunks; i++) {
      const size = Math.min(CHUNK_SIZE, stat.size - i * CHUNK_SIZE);
      const buffer = Buffer.alloc(size);
      const bytesRead = fs.readSync(fd, buffer, 0, size, i * CHUNK_SIZE);
      if (bytesRead !== size) throw new Error(`Could not read chunk ${i}`);
      fullHash.update(buffer);
      await api(`/v1/files/${manifest.id}/chunks/${i}`, {
        method: "PUT",
        headers: { "Content-Type": "application/octet-stream" },
        body: buffer
      });
      console.log(`Uploaded chunk ${i + 1}/${manifest.totalChunks}`);
    }
    const finalHash = fullHash.digest("hex");
    if (finalHash !== manifest.sha256) throw new Error("Local file changed during upload; hash mismatch.");
    console.log(`FILE_ID=${manifest.id}`);
  } finally {
    fs.closeSync(fd);
  }
}
async function hashFile(filePath) {
  return await new Promise((resolve, reject) => {
    const h = createHash("sha256");
    const stream = fs.createReadStream(filePath);
    stream.on("data", chunk => h.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(h.digest("hex")));
  });
}
async function download(id, outputPath) {
  const manifest = await api(`/v1/files/${id}`).then(r => r.json());
  if (manifest.status !== "complete") throw new Error(`File is not complete (status: ${manifest.status})`);
  const output = fs.createWriteStream(outputPath, { flags: "wx" });
  const fullHash = createHash("sha256");
  try {
    for (let i = 0; i < manifest.total_chunks; i++) {
      const response = await api(`/v1/files/${id}/chunks/${i}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      const actual = hash(bytes);
      const expected = response.headers.get("X-Chunk-SHA256");
      if (!expected || actual !== expected) throw new Error(`Chunk ${i} failed local integrity check`);
      fullHash.update(bytes);
      if (!output.write(bytes)) await new Promise(resolve => output.once("drain", resolve));
      console.log(`Downloaded chunk ${i + 1}/${manifest.total_chunks}`);
    }
    await new Promise((resolve, reject) => output.end(error => error ? reject(error) : resolve()));
    const digest = fullHash.digest("hex");
    if (manifest.sha256 && digest !== manifest.sha256) {
      fs.unlinkSync(outputPath);
      throw new Error("Whole-file SHA-256 mismatch; output removed.");
    }
    console.log(`Saved ${outputPath}`);
  } catch (error) {
    output.destroy();
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    throw error;
  }
}
async function status(id) {
  const data = await api(`/v1/files/${id}`).then(r => r.json());
  console.log(JSON.stringify(data, null, 2));
}
const [command, ...args] = process.argv.slice(2);
try {
  if (command === "upload" && args[0]) await upload(args[0]);
  else if (command === "download" && args[0] && args[1]) await download(args[0], args[1]);
  else if (command === "status" && args[0]) await status(args[0]);
  else {
    console.log("Usage:\n  node cloudflare/client.js upload <file>\n  node cloudflare/client.js download <file-id> <output>\n  node cloudflare/client.js status <file-id>");
  }
} catch (error) { fail(error.message); }
