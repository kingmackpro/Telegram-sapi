import { HTML } from "./ui.js";
const CHUNK_SIZE = 10 * 1024 * 1024;
const COOKIE = "sapi_session";
const TELEGRAM_API = "https://api.telegram.org";

function json(data, status = 200, extraHeaders = {}) {
  const headers = new Headers({ "Cache-Control": "no-store" });
  for (const [name, value] of Object.entries(extraHeaders)) headers.set(name, value);
  return Response.json(data, { status, headers });
}
function readCookie(request) {
  const parts = (request.headers.get("Cookie") || "").split(";");
  for (const part of parts) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === COOKIE) return part.slice(i + 1).trim();
  }
  return "";
}
function sameSecret(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}
function cookieHeader(token, age) {
  return COOKIE + "=" + token + "; Path=/; Max-Age=" + age + "; HttpOnly; Secure; SameSite=Strict";
}
function originAllowed(request) {
  const origin = request.headers.get("Origin");
  return !origin || origin === new URL(request.url).origin;
}
function authorized(request, env) {
  if (!env.API_TOKEN) return false;
  const bearer = request.headers.get("Authorization") || "";
  return sameSecret(bearer, "Bearer " + env.API_TOKEN) || sameSecret(readCookie(request), env.API_TOKEN);
}
function hex(bytes) {
  return [...new Uint8Array(bytes)].map(v => v.toString(16).padStart(2, "0")).join("");
}
async function sha256(buffer) {
  return hex(await crypto.subtle.digest("SHA-256", buffer));
}
function fileId() { return "f_" + crypto.randomUUID().replaceAll("-", ""); }
async function tg(env, method, body) {
  const response = await fetch(`${TELEGRAM_API}/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, { method: "POST", body });
  const data = await response.json();
  if (!response.ok || !data.ok) {
    const error = new Error(data.description || `Telegram API HTTP ${response.status}`);
    error.telegramRejected = response.status < 500;
    error.retryAfter = data.parameters?.retry_after;
    throw error;
  }
  return data.result;
}
async function getFile(env, telegramFileId) {
  const result = await tg(env, "getFile", new URLSearchParams({ file_id: telegramFileId }));
  const response = await fetch(`${TELEGRAM_API}/file/bot${env.TELEGRAM_BOT_TOKEN}/${result.file_path}`);
  if (!response.ok) throw new Error(`Telegram file download HTTP ${response.status}`);
  return response;
}
async function ensureConfig(env) {
  if (!env.DB || !env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID || !env.API_TOKEN) {
    throw new Error("Worker configuration incomplete: D1 binding and API_TOKEN, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID secrets are required");
  }
}
export default {
  async scheduled(controller, env, ctx) {
    const expired = await env.DB.prepare("SELECT id FROM files WHERE status='uploading' AND expires_at IS NOT NULL AND expires_at<=datetime('now') LIMIT 100").all();
    for (const row of expired.results) {
      await env.DB.prepare("DELETE FROM files WHERE id=? AND status='uploading' AND expires_at<=datetime('now')").bind(row.id).run();
    }
  },
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/health") {
      return json({ ok: true, service: "telegram-sapi-worker", version: "0.3.0-web" });
    }
    if (request.method === "GET" && url.pathname === "/") {
      return new Response(HTML, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer", "Content-Security-Policy": "default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'" } });
    }
    if (request.method === "POST" && url.pathname === "/auth/login") {
      if (!originAllowed(request)) return json({ error: "Invalid request origin" }, 403);
      if (!env.API_TOKEN) return json({ error: "API_TOKEN is not configured" }, 503);
      let body;
      try { body = await request.json(); } catch { return json({ error: "Expected JSON body" }, 400); }
      if (!sameSecret(body && body.password, env.API_TOKEN)) return json({ error: "Invalid password" }, 401);
      return json({ ok: true }, 200, { "Set-Cookie": cookieHeader(env.API_TOKEN, 604800) });
    }
    if (request.method === "POST" && url.pathname === "/auth/logout") {
      if (!originAllowed(request)) return json({ error: "Invalid request origin" }, 403);
      return json({ ok: true }, 200, { "Set-Cookie": cookieHeader("", 0) });
    }
    if (request.method === "GET" && url.pathname === "/auth/me") {
      return authorized(request, env) ? json({ authenticated: true }) : json({ error: "Unauthorized" }, 401);
    }
    if (!authorized(request, env)) return json({ error: "Unauthorized" }, 401);
    if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method) && readCookie(request) && !originAllowed(request)) {
      return json({ error: "Invalid request origin" }, 403);
    }
    try {
      await ensureConfig(env);
      if (request.method === "GET" && url.pathname === "/v1/files") {
        const q = (url.searchParams.get("q") || "").trim().slice(0, 120);
        const rawStatus = url.searchParams.get("status") || "";
        const status = ["complete", "uploading", "error"].includes(rawStatus) ? rawStatus : "";
        const limit = Math.min(100, Math.max(1, Number.parseInt(url.searchParams.get("limit") || "25", 10) || 25));
        const offset = Math.min(1000000, Math.max(0, Number.parseInt(url.searchParams.get("offset") || "0", 10) || 0));
        const clauses = [], values = [];
        if (q) { clauses.push("filename LIKE ? COLLATE NOCASE"); values.push("%" + q + "%"); }
        if (status) { clauses.push("status=?"); values.push(status); }
        const where = clauses.length ? " WHERE " + clauses.join(" AND ") : "";
        const total = await env.DB.prepare("SELECT COUNT(*) AS total FROM files" + where).bind(...values).first();
        const files = await env.DB.prepare("SELECT id,filename,size_bytes,chunk_size,total_chunks,sha256,status,created_at,updated_at FROM files" + where + " ORDER BY created_at DESC LIMIT ? OFFSET ?").bind(...values, limit, offset).all();
        return json({ files: files.results, total: total.total, limit, offset });
      }
      if (request.method === "POST" && url.pathname === "/v1/files") {
        const body = await request.json();
        if (!body || typeof body.filename !== "string" || body.filename.length < 1 || body.filename.length > 255 ||
            !Number.isSafeInteger(body.size) || body.size < 0 ||
            typeof body.fingerprint !== "string" || !/^[a-f0-9]{64}$/i.test(body.fingerprint)) {
          return json({ error: "Expected filename, non-negative integer size, and 64-character fingerprint" }, 400);
        }
        const existing = await env.DB.prepare("SELECT id FROM files WHERE fingerprint=? AND size_bytes=? AND status='uploading' AND expires_at>datetime('now') ORDER BY updated_at DESC LIMIT 1").bind(body.fingerprint, body.size).first();
        if (existing) {
          await env.DB.prepare("UPDATE files SET updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now'),expires_at=datetime('now','+24 hours') WHERE id=?").bind(existing.id).run();
          await env.DB.prepare("UPDATE chunks SET status='pending',error=NULL WHERE file_id=? AND status IN ('uncertain','uploading')").bind(existing.id).run();
          const old = await env.DB.prepare("SELECT id,filename,size_bytes,chunk_size,total_chunks,status FROM files WHERE id=?").bind(existing.id).first();
          const chunks = await env.DB.prepare("SELECT chunk_index,status,sha256 FROM chunks WHERE file_id=? ORDER BY chunk_index").bind(existing.id).all();
          return json({ ...old, resumed: true, chunks: chunks.results }, 200);
        }
        const id = fileId();
        const total = Math.ceil(body.size / CHUNK_SIZE);
        await env.DB.prepare("INSERT INTO files (id,filename,size_bytes,chunk_size,total_chunks,sha256,status,fingerprint,expires_at) VALUES (?,?,?,?,?,?,?,?,datetime('now','+24 hours'))")
          .bind(id, body.filename, body.size, CHUNK_SIZE, total, body.sha256 || null, total === 0 ? "complete" : "uploading", body.fingerprint).run();
        const stmts = [];
        for (let i = 0; i < total; i++) {
          const size = Math.min(CHUNK_SIZE, body.size - i * CHUNK_SIZE);
          stmts.push(env.DB.prepare("INSERT INTO chunks (file_id,chunk_index,size_bytes,status) VALUES (?,?,?,'pending')").bind(id, i, size));
        }
        if (stmts.length) await env.DB.batch(stmts);
        return json({ id, filename: body.filename, size: body.size, chunkSize: CHUNK_SIZE, totalChunks: total, status: total === 0 ? "complete" : "uploading", resumed: false, chunks: [] }, 201);
      }
      const deletePrefix = "/v1/files/";
      if (request.method === "DELETE" && url.pathname.startsWith(deletePrefix)) {
        const deleteId = url.pathname.slice(deletePrefix.length);
        if (!deleteId || deleteId.includes("/")) return json({ error: "Not found" }, 404);
        const existing = await env.DB.prepare("SELECT id FROM files WHERE id=?").bind(deleteId).first();
        if (!existing) return json({ error: "File not found" }, 404);
        // Remove only D1 metadata. Telegram messages/documents are intentionally left untouched.
        await env.DB.batch([
          env.DB.prepare("DELETE FROM chunks WHERE file_id=?").bind(deleteId),
          env.DB.prepare("DELETE FROM files WHERE id=?").bind(deleteId)
        ]);
        return json({ id: deleteId, deleted: true, storage: "database_only", telegramDeleted: false });
      }
      const finalizePrefix = "/v1/files/";
      const finalizeSuffix = "/complete";
      const finalizePath = url.pathname;
      const finalizeMatch = finalizePath.startsWith(finalizePrefix) && finalizePath.endsWith(finalizeSuffix)
        ? finalizePath.slice(finalizePrefix.length, -finalizeSuffix.length)
        : "";
      if (request.method === "POST" && finalizeMatch) {
        const id = finalizeMatch;
        const file = await env.DB.prepare("SELECT id,status,total_chunks FROM files WHERE id=?").bind(id).first();
        if (!file) return json({ error: "File not found" }, 404);
        const pending = await env.DB.prepare("SELECT COUNT(*) AS n FROM chunks WHERE file_id=? AND status!='uploaded'").bind(id).first();
        if (pending.n !== 0) return json({ error: "Upload is not complete", pendingChunks: pending.n }, 409);
        await env.DB.prepare("UPDATE files SET status='complete',expires_at=NULL,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?").bind(id).run();
        return json({ id, status: "complete", totalChunks: file.total_chunks });
      }
      const match = url.pathname.match(/^\/v1\/files\/([a-zA-Z0-9_-]+)(?:\/chunks\/(\d+))?$/);
      if (!match) return json({ error: "Not found" }, 404);
      const id = match[1];
      const indexText = match[2];
      const file = await env.DB.prepare("SELECT * FROM files WHERE id=?").bind(id).first();
      if (!file) return json({ error: "File not found" }, 404);
      if (request.method === "GET" && indexText === undefined) {
        const chunks = await env.DB.prepare("SELECT chunk_index,size_bytes,sha256,status,telegram_message_id FROM chunks WHERE file_id=? ORDER BY chunk_index").bind(id).all();
        return json({ ...file, chunks: chunks.results });
      }
      if (indexText === undefined) return json({ error: "Chunk index required" }, 400);
      const index = Number(indexText);
      if (!Number.isSafeInteger(index) || index < 0 || index >= file.total_chunks) return json({ error: "Invalid chunk index" }, 400);
      const chunk = await env.DB.prepare("SELECT * FROM chunks WHERE file_id=? AND chunk_index=?").bind(id, index).first();
      if (!chunk) return json({ error: "Chunk not found" }, 404);
      if (request.method === "PUT") {
        if (chunk.status === "uploaded") return json({ error: "Chunk already uploaded", sha256: chunk.sha256 }, 409);
        if (chunk.status === "uncertain" || chunk.status === "uploading") return json({ error: "Chunk outcome is uncertain; reconcile before retrying" }, 409);
        const bytes = await request.arrayBuffer();
        if (bytes.byteLength !== chunk.size_bytes) return json({ error: "Chunk size mismatch", expected: chunk.size_bytes, received: bytes.byteLength }, 400);
        const digest = await sha256(bytes);
        await env.DB.prepare("UPDATE chunks SET status='uploading',sha256=?,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE file_id=? AND chunk_index=?")
          .bind(digest, id, index).run();
        const form = new FormData();
        form.set("chat_id", env.TELEGRAM_CHAT_ID);
        form.set("document", new Blob([bytes], { type: "application/octet-stream" }), `${id}.part${index}`);
        let message;
        try {
          message = await tg(env, "sendDocument", form);
        } catch (error) {
          const state = error.telegramRejected ? "pending" : "uncertain";
          await env.DB.prepare("UPDATE chunks SET status=?,error=?,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE file_id=? AND chunk_index=?")
            .bind(state, error.message.slice(0, 500), id, index).run();
          return json({ error: error.message, status: state, retryAfter: error.retryAfter || null }, error.telegramRejected ? 502 : 503);
        }
        const doc = message.document;
        if (!doc?.file_id) {
          await env.DB.prepare("UPDATE chunks SET status='uncertain',error='Telegram response missing document file_id' WHERE file_id=? AND chunk_index=?").bind(id, index).run();
          return json({ error: "Telegram response incomplete; chunk marked uncertain" }, 503);
        }
        await env.DB.prepare("UPDATE chunks SET status='uploaded',telegram_message_id=?,telegram_file_id=?,error=NULL,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE file_id=? AND chunk_index=?")
          .bind(message.message_id, doc.file_id, id, index).run();
        await env.DB.prepare("UPDATE files SET updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now'),expires_at=datetime('now','+24 hours') WHERE id=? AND status='uploading'").bind(id).run();
        const pending = await env.DB.prepare("SELECT COUNT(*) AS n FROM chunks WHERE file_id=? AND status!='uploaded'").bind(id).first();
        if (pending.n === 0) {
          await env.DB.prepare("UPDATE files SET status='complete',expires_at=NULL,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?").bind(id).run();
        }
        return json({ id, index, status: "uploaded", size: bytes.byteLength, sha256: digest, telegramMessageId: message.message_id });
      }
      if (request.method === "GET") {
        if (chunk.status !== "uploaded" || !chunk.telegram_file_id) return json({ error: "Chunk is not available", status: chunk.status }, 409);
        const response = await getFile(env, chunk.telegram_file_id);
        const bytes = await response.arrayBuffer();
        if (bytes.byteLength !== chunk.size_bytes || await sha256(bytes) !== chunk.sha256) {
          return json({ error: "Downloaded chunk failed integrity verification" }, 502);
        }
        return new Response(bytes, { headers: { "Content-Type": "application/octet-stream", "Content-Length": String(bytes.byteLength), "X-Chunk-SHA256": chunk.sha256, "Cache-Control": "no-store" } });
      }
      return json({ error: "Method not allowed" }, 405);
    } catch (error) {
      console.error("telegram-sapi error", error);
      return json({ error: error.message || "Internal error" }, 500);
    }
  }
};