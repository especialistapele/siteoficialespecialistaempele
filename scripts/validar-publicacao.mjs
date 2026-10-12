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
  const movedTo = /<meta name="conteudo-movido-para" content="([^"]+)">/i.exec(html)?.[1] || null;
  if (!id && exigirId) erros.push(`${caminho}: falta meta conteudo-id.`);
  if (!canon) erros.push(`${caminho}: falta canonical.`);
  if (canon && !canon.startsWith(SITE + "/")) erros.push(`${caminho}: canonical fora do domínio: ${canon}`);
  if (!title) erros.push(`${caminho}: falta title.`);
  if (movedTo) {
    if (canon !== movedTo) erros.push(`${caminho}: canonical do redirecionamento difere do destino.`);
    if (!/noindex/i.test(robots)) erros.push(`${caminho}: redirecionamento deve usar noindex.`);
    return id;
  }
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

  for (const caminho of htmlFiles("tratamentos")) validarArquivo(caminho, false);

  const [tratamentos, artigos, resultados] = await Promise.all([
    buscar("treatments?select=id,slug,published&published=eq.true"),
    buscar("articles?select=id,public_id,slug,published&published=eq.true"),
    buscar("results?select=id,public_id,slug,published,consent_confirmed&published=eq.true&consent_confirmed=eq.true"),
  ]);
  const arquivosTratamentos = htmlFiles("tratamentos");
  const nomesTratamentos = new Set(arquivosTratamentos.map((p) => p.split("/").pop()));
  const slugsTratamentos = new Map();
  for (const t of tratamentos) {
    if (!t.slug) { erros.push(`Tratamento ${t.id}: publicado sem slug.`); continue; }
    const slug = slugify(t.slug);
    if (!slug) { erros.push(`Tratamento ${t.id}: slug inválido após normalização.`); continue; }
    if (slugsTratamentos.has(slug)) {
      erros.push(`Tratamento: slug duplicado após normalização "${slug}" (IDs ${slugsTratamentos.get(slug)} e ${t.id}).`);
    } else {
      slugsTratamentos.set(slug, t.id);
    }
    const arquivo = `tratamentos/${slug}.html`;
    if (!nomesTratamentos.has(arquivo.split("/").pop())) erros.push(`Tratamento publicado sem página estática: ${arquivo}`);
  }

  // Conferir que cada registro publicável tem identidade estável, slug único
  // após normalização e página estática correspondente.
  for (const [nome, dir, registros] of [
    ["artigo", "blog", artigos],
    ["resultado", "resultados", resultados],
  ]) {
    const slugs = new Map();
    for (const item of registros) {
      if (!item.public_id) erros.push(`${nome} ${item.id}: publicado sem public_id.`);
      if (!item.slug) { erros.push(`${nome} ${item.id}: publicado sem slug.`); continue; }
      const slug = slugify(item.slug);
      if (!slug) { erros.push(`${nome} ${item.id}: slug inválido após normalização.`); continue; }
      if (slugs.has(slug)) erros.push(`${nome}: slug duplicado após normalização "${slug}" (IDs ${slugs.get(slug)} e ${item.id}).`);
      else slugs.set(slug, item.id);
      const arquivo = `${dir}/${slug}.html`;
      if (!existsSync(arquivo)) erros.push(`${nome} publicado sem página estática: ${arquivo}`);
    }
  }

  const sitemap = extrairSitemap(), sitemapSet = new Set(sitemap);
  if (sitemap.length !== sitemapSet.size) {
    const contagens = new Map();
    for (const url of sitemap) contagens.set(url, (contagens.get(url) || 0) + 1);
    for (const [url, quantidade] of contagens) if (quantidade > 1) erros.push(`URL duplicada no sitemap (${quantidade} vezes): ${url}`);
  }
  const skinMapUrl = `${SITE}/skinmap/skinmapinicio.html`;
  if (!existsSync("skinmap/skinmapinicio.html")) erros.push("Página inicial do SkinMap não existe: skinmap/skinmapinicio.html");
  if (!sitemapSet.has(skinMapUrl)) erros.push("Página inicial do SkinMap fora do sitemap: skinmap/skinmapinicio.html");
  for (const caminho of arquivosTratamentos) {
    const html = readFileSync(caminho, "utf8");
    if (/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html)) continue;
    if (!sitemapSet.has(`${SITE}/${caminho}`)) erros.push(`Página de tratamento fora do sitemap: ${caminho}`);
  }
  for (const caminho of htmlFiles("blog")) if (!sitemapSet.has(`${SITE}/${caminho}`)) avisos.push(`Página de blog fora do sitemap: ${caminho}`);
  for (const caminho of htmlFiles("resultados")) if (!sitemapSet.has(`${SITE}/${caminho}`)) avisos.push(`Página de resultado fora do sitemap: ${caminho}`);
  // Conferir todas as URLs internas do sitemap, não apenas páginas de conteúdo.
  // URLs com barra final correspondem ao index.html do diretório no build estático.
  for (const url of sitemap) {
    let parsed;
    try { parsed = new URL(url); } catch {
      erros.push(`URL inválida no sitemap: ${url}`);
      continue;
    }
    if (parsed.origin !== SITE) continue;
    if (parsed.search || parsed.hash) {
      erros.push(`URL do sitemap contém query string ou fragmento: ${url}`);
      continue;
    }
    let caminho;
    try { caminho = decodeURIComponent(parsed.pathname).replace(/^\/+/, ""); } catch {
      erros.push(`URL do sitemap contém caminho inválido: ${url}`);
      continue;
    }
    if (!caminho) caminho = "index.html";
    else if (caminho.endsWith("/")) caminho += "index.html";
    if (!existsSync(caminho)) erros.push(`Sitemap aponta para arquivo inexistente: ${caminho}`);
  }

  console.log(`Validação: ${sitemap.length} URLs no sitemap; ${ids.size} páginas com ID; ${erros.length} erro(s); ${avisos.length} aviso(s).`);
  for (const a of avisos) console.warn("AVISO:", a);
  if (erros.length) { console.error("\nERROS DE PUBLICAÇÃO:"); for (const e of erros) console.error("-", e); process.exit(1); }
}
main().catch((e) => { console.error(e); process.exit(1); });
