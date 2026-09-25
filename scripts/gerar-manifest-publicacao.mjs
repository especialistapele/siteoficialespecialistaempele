// ============================================================
// Inventário central da publicação estática.
// Gera publicacao-manifest.json para permitir auditoria e para que
// o painel/serviços externos saibam o estado público de cada URL.
//
// status:
//   published -> página canônica atual (HTTP esperado 200)
//   redirect  -> endereço antigo de conteúdo (GitHub Pages usa
//                redirecionamento por HTML/meta refresh; esperado 200)
//   manual    -> página criada fora do painel, preservada pelo pipeline
//
// O ID estável é sempre conteudo-id quando disponível.
// ============================================================

import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";

const SITE = "https://www.especialistaempele.com.br";
const dirs = ["blog", "resultados", "tratamentos"];

function files(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isFile() && e.name.endsWith(".html") && e.name !== "index.html" && e.name !== "detalhe.html")
    .map(e => `${dir}/${e.name}`);
}
function meta(html, name) {
  return new RegExp(`<meta name=["']${name}["'] content=["']([^"']*)["']`, "i").exec(html)?.[1] || null;
}
function canonical(html) {
  return /<link rel=["']canonical["'] href=["']([^"']+)["']/i.exec(html)?.[1] || null;
}
function sha256(text) {
  return createHash("sha256").update(text).digest("hex");
}

const items = [];
for (const dir of dirs) {
  for (const path of files(dir)) {
    const html = readFileSync(path, "utf8");
    const id = meta(html, "conteudo-id");
    const moved = meta(html, "conteudo-movido-para");
    const canonicalUrl = canonical(html);
    const generated = /AUTO-GENERATED:(?:TREATMENT-PAGE|)/i.test(html) || !!id;
    items.push({
      path,
      url: `${SITE}/${path}`,
      id,
      status: moved ? "redirect" : (generated ? "published" : "manual"),
      http_status: moved ? 200 : 200,
      canonical: canonicalUrl,
      redirect_to: moved,
      sha256: sha256(html),
      updated_at: new Date().toISOString(),
    });
  }
}

const byId = new Map();
for (const item of items) {
  if (!item.id) continue;
  if (byId.has(item.id)) throw new Error(`ID estável duplicado no inventário: ${item.id}`);
  byId.set(item.id, item.path);
}

const manifest = {
  schema_version: 1,
  generated_at: new Date().toISOString(),
  site: SITE,
  source: "static-build",
  status_codes: {
    published: 200,
    redirect: 200,
    removed: 404,
    manual: 200,
  },
  total: items.length,
  items,
};

writeFileSync("publicacao-manifest.json", JSON.stringify(manifest, null, 2) + "\n", "utf8");
console.log(`Manifesto de publicação: ${items.length} URL(s) inventariada(s).`);
