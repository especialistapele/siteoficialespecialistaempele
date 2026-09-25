import { existsSync, readFileSync, writeFileSync } from "node:fs";

const path = "publicacao-log.json";
const requestId = process.env.PUBLICACAO_REQUEST_ID || null;
const status = process.env.PUBLICACAO_STATUS || "success";
const trigger = process.env.PUBLICACAO_TRIGGER || "workflow";
const contentPath = process.env.PUBLICACAO_PATH || null;
const contentId = process.env.PUBLICACAO_ID || null;
const rawPublished = process.env.PUBLICACAO_PUBLICADO ?? "";
const published = rawPublished === "true" ? true : rawPublished === "false" ? false : null;
const now = new Date().toISOString();

let log = { schema_version: 1, site: "https://www.especialistaempele.com.br", events: [] };
if (existsSync(path)) {
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8"));
    if (parsed && Array.isArray(parsed.events)) log = parsed;
  } catch (_) {}
}

const event = {
  request_id: requestId,
  status,
  trigger,
  path: contentPath,
  content_id: contentId,
  publicado: published,
  requested_at: process.env.PUBLICACAO_REQUESTED_AT || null,
  completed_at: now,
  workflow_run_id: process.env.GITHUB_RUN_ID || null,
  workflow_sha: process.env.GITHUB_SHA || null,
  ref: process.env.GITHUB_REF_NAME || "main",
};

log.events.push(event);
if (log.events.length > 500) log.events = log.events.slice(-500);
log.updated_at = now;
log.total = log.events.length;

writeFileSync(path, JSON.stringify(log, null, 2) + "\n", "utf8");
console.log(`Log de publicação: ${status} ${requestId || "(sem request_id)"}`);
