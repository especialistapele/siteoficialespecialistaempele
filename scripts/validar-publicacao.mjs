// Valida a publicação estática antes do workflow terminar.
import { readFileSync, readdirSync, existsSync } from "node:fs";

const SITE = "https://www.especialistaempele.com.br";
const SUPABASE_URL = process.env.SUPABASE_URL || "https://clwaotfbqwvxpykruwed.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
if (!SUPABASE_ANON_KEY) { console.error("Faltou SUPABASE_ANON_KEY."); process.exit(1); }

const erros = [], avisos = [];
async function buscar(caminho) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${caminho}`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
  return r.json();
}
function slugify(v) {
  return String(v ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function htmlFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".html") && e.name !== "index.html" && e.name !== "detalhe.html")
    .map((e) => `${dir}/${e.name}`);
}
function validarArquivo(caminho, exigirId = true) {
  const html = readFileSync(caminho, "utf8");
  const id = /<meta name="conteudo-id" content="([^"]+)">/i.exec(html)?.[1] || null;
  const canon = /<link rel="canonical" href="([^"]+)">/i.exec(html)?.[1] || null;
  const title = /<title>\s*([^<]+?)\s*<\/title>/i.exec(html)?.[1] || null;
  const description = /<meta name="description" content="([^"]*)">/i.exec(html)?.[1] ?? null;
  const robots = /<meta name="robots" content="([^"]+)">/i.exec(html)?.[1] || "";
  if (!id && exigirId) erros.push(`${caminho}: falta meta conteudo-id.`);
  if (!canon) erros.push(`${caminho}: falta canonical.`);
  if (canon && !canon.startsWith(SITE + "/")) erros.push(`${caminho}: canonical fora do domínio: ${canon}`);
  if (!title) erros.push(`${caminho}: falta title.`);
  if (description === null) erros.push(`${caminho}: falta meta description.`);
  if (!/index\s*,?\s*follow/i.test(robots)) erros.push(`${caminho}: robots não está index,follow.`);
  return id;
}
function extrairSitemap() {
  if (!existsSync("sitemap.xml")) return [];
  return [...readFileSync("sitemap.xml","utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}
async function main() {
  if (!existsSync("sitemap.xml")) erros.push("sitemap.xml não existe.");
  const ids = new Map();
  for (const dir of ["blog","resultados"]) {
    for (const caminho of htmlFiles(dir)) {
      const id = validarArquivo(caminho);
      if (id) {
        if (ids.has(id)) erros.push(`ID duplicado ${id}: ${ids.get(id)} e ${caminho}`);
        else ids.set(id, caminho);
      }
    }
  }

  for (const caminho of htmlFiles("tratamentos")) validarArquivo(caminho, false);\n\n  const tratamentos = await buscar("treatments?select=id,public_id,slug,published&published=eq.true");
  const arquivosTratamentos = htmlFiles("tratamentos");
  const nomesTratamentos = new Set(arquivosTratamentos.map((p) => p.split("/").pop()));
  for (const t of tratamentos) {
    if (!t.slug) { erros.push(`Tratamento ${t.id}: publicado sem slug.`); continue; }
    const arquivo = `tratamentos/${slugify(t.slug)}.html`;
    if (!nomesTratamentos.has(arquivo.split("/").pop())) erros.push(`Tratamento publicado sem página estática: ${arquivo}`);
    if (t.public_id && ids.has(t.public_id) && !ids.get(t.public_id).startsWith("tratamentos/"))
      erros.push(`ID de tratamento ${t.public_id} colide com ${ids.get(t.public_id)}`);
  }

  const sitemap = extrairSitemap(), sitemapSet = new Set(sitemap);
  for (const caminho of arquivosTratamentos) {
    const html = readFileSync(caminho, "utf8");
    if (/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html)) continue;
    if (!sitemapSet.has(`${SITE}/${caminho}`)) erros.push(`Página de tratamento fora do sitemap: ${caminho}`);
  }
  for (const caminho of htmlFiles("blog")) if (!sitemapSet.has(`${SITE}/${caminho}`)) avisos.push(`Página de blog fora do sitemap: ${caminho}`);
  for (const caminho of htmlFiles("resultados")) if (!sitemapSet.has(`${SITE}/${caminho}`)) avisos.push(`Página de resultado fora do sitemap: ${caminho}`);
  for (const url of sitemap) {
    if (!url.startsWith(SITE + "/")) continue;
    const path = url.slice(SITE.length + 1);
    if (/^(blog|resultados|tratamentos)\/.+\.html$/.test(path) && !existsSync(path))
      erros.push(`Sitemap aponta para arquivo inexistente: ${path}`);
  }

  console.log(`Validação: ${sitemap.length} URLs no sitemap; ${ids.size} páginas com ID; ${erros.length} erro(s); ${avisos.length} aviso(s).`);
  for (const a of avisos) console.warn("AVISO:", a);
  if (erros.length) { console.error("\nERROS DE PUBLICAÇÃO:"); for (const e of erros) console.error("-", e); process.exit(1); }
}
main().catch((e) => { console.error(e); process.exit(1); });
