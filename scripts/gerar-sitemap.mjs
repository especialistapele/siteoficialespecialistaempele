// ============================================================
// Gera o sitemap.xml completo do site: páginas fixas + artigos
// e tratamentos publicados (buscados direto no Supabase).
//
// Roda automaticamente pelo GitHub Actions (veja
// .github/workflows/atualizar-sitemap.yml), mas também pode ser
// executado manualmente:
//
//   SUPABASE_URL=... SUPABASE_ANON_KEY=... node scripts/gerar-sitemap.mjs
//
// Não precisa de nenhuma dependência além do Node 18+ (usa o
// fetch nativo).
//
// Artigos    -> /blog/<slug>.html        (com a imagem de capa)
// Resultados -> /resultados/<slug>.html  (com TODAS as fotos do caso)
// As imagens vão dentro do próprio sitemap.xml (extensão image:image
// do Google), então não é preciso um sitemap de imagens separado.
// ============================================================

import { writeFileSync } from "node:fs";

const SITE = "https://www.especialistaempele.com.br";
const SUPABASE_URL = process.env.SUPABASE_URL || "https://clwaotfbqwvxpykruwed.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_ANON_KEY) {
  console.error("Faltou a variável de ambiente SUPABASE_ANON_KEY.");
  process.exit(1);
}

// Páginas fixas do site (as mesmas que já existiam no sitemap estático).
// changefreq/priority ajustados por importância estratégica de SEO.
const PAGINAS_FIXAS = [
  { loc: "/", changefreq: "weekly", priority: "1.0" },
  { loc: "/pele.html", changefreq: "monthly", priority: "0.9" },
  { loc: "/quemsomos.html", changefreq: "monthly", priority: "0.9" },
  { loc: "/consultoriaonline.html", changefreq: "monthly", priority: "0.9" },
  { loc: "/tradicaotecnologia.html", changefreq: "monthly", priority: "0.8" },
  { loc: "/nanotecnologia.html", changefreq: "monthly", priority: "0.8" },
  { loc: "/tratamentos/", changefreq: "weekly", priority: "0.9" },
  { loc: "/blog/", changefreq: "weekly", priority: "0.8" },
  { loc: "/resultados/", changefreq: "monthly", priority: "0.7" },
  { loc: "/depoimentos.html", changefreq: "monthly", priority: "0.6" },
  { loc: "/contato.html", changefreq: "monthly", priority: "0.8" },
  { loc: "/estetica-regenerativa-araruama.html", changefreq: "monthly", priority: "0.8" },
  { loc: "/estetica-regenerativa-cabo-frio-riviera.html", changefreq: "monthly", priority: "0.8" },
  { loc: "/estetica-regenerativa-copacabana.html", changefreq: "monthly", priority: "0.8" },
  { loc: "/pre-atendimento/", changefreq: "monthly", priority: "0.7" },
];

async function buscarPublicados(tabela) {
  const url = `${SUPABASE_URL}/rest/v1/${tabela}?select=*&published=eq.true`;
  const resp = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!resp.ok) {
    throw new Error(`Erro ao buscar "${tabela}": ${resp.status} ${await resp.text()}`);
  }
  return resp.json();
}

// Mesma regra de slug usada em scripts/gerar-paginas-tratamentos.mjs e
// em assets/js/tratamentos-data.js — precisa ficar idêntica nos três
// lugares, senão os links quebram.
function slugifyUrl(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// A tabela pode ter published_at, created_at ou nenhum dos dois —
// usa o que existir, e se não existir nenhum, omite o <lastmod>.
function ultimaData(row) {
  const bruta = row.updated_at || row.published_at || row.created_at || null;
  if (!bruta) return null;
  const d = new Date(bruta);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function esc(v) {
  return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function urlXml({ loc, lastmod, changefreq, priority, imagens = [] }) {
  return [
    "  <url>",
    `    <loc>${esc(loc)}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : null,
    priority ? `    <priority>${priority}</priority>` : null,
    ...[...new Set(imagens.filter(Boolean))].map((u) => `    <image:image><image:loc>${esc(u)}</image:loc></image:image>`),
    "  </url>",
  ].filter(Boolean).join("\n");
}

async function main() {
  const hoje = new Date().toISOString().slice(0, 10);
  const entradas = PAGINAS_FIXAS.map((p) =>
    urlXml({ loc: SITE + p.loc, lastmod: hoje, changefreq: p.changefreq, priority: p.priority })
  );

  // Se QUALQUER leitura falhar, aborta: gerar um sitemap incompleto tiraria
  // páginas ativas do sitemap. O sitemap.xml anterior é mantido.
  const [artigos, tratamentos, resultados, fotosExtras] = await Promise.all([
    buscarPublicados("articles"),
    buscarPublicados("treatments"),
    fetch(`${SUPABASE_URL}/rest/v1/results?select=*&published=eq.true&consent_confirmed=eq.true`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    }).then(async (r) => { if (!r.ok) throw new Error(`Erro ao buscar "results": ${r.status}`); return r.json(); }),
    fetch(`${SUPABASE_URL}/rest/v1/result_images?select=*&order=position.asc`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    }).then(async (r) => { if (!r.ok) throw new Error(`Erro ao buscar "result_images": ${r.status}`); return r.json(); }),
  ]);

  for (const a of artigos) {
    if (!a.slug || !a.public_id) continue;
    // Página estática pré-renderizada em /blog/<slug>.html
    // (gerada por gerar-paginas-artigos.mjs).
    entradas.push(urlXml({
      loc: `${SITE}/blog/${slugifyUrl(a.slug)}.html`,
      lastmod: ultimaData(a),
      changefreq: "monthly",
      priority: "0.6",
      imagens: [a.cover_image_url],
    }));
  }

  const extrasPorResultado = new Map();
  for (const im of fotosExtras) {
    if (!extrasPorResultado.has(im.result_id)) extrasPorResultado.set(im.result_id, []);
    extrasPorResultado.get(im.result_id).push(im.url);
  }
  for (const r of resultados) {
    if (!r.slug || !r.public_id) continue;
    // Página estática em /resultados/<slug>.html (gerada por
    // gerar-paginas-resultados.mjs), com todas as fotos do caso.
    entradas.push(urlXml({
      loc: `${SITE}/resultados/${slugifyUrl(r.slug)}.html`,
      lastmod: ultimaData(r),
      changefreq: "monthly",
      priority: "0.6",
      imagens: [r.after_image_url, r.before_image_url, ...(extrasPorResultado.get(r.id) || [])],
    }));
  }

  for (const t of tratamentos) {
    if (!t.slug) continue;
    // Agora aponta para a página estática pré-renderizada em
    // /tratamentos/<slug>.html (gerada por gerar-paginas-tratamentos.mjs),
    // em vez da versão dinâmica via query string.
    entradas.push(urlXml({
      loc: `${SITE}/tratamentos/${slugifyUrl(t.slug)}.html`,
      lastmod: ultimaData(t),
      changefreq: "monthly",
      priority: "0.7",
    }));
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${entradas.join("\n")}\n</urlset>\n`;
  writeFileSync("sitemap.xml", xml, "utf-8");
  console.log(`sitemap.xml gerado com ${PAGINAS_FIXAS.length} páginas fixas + ${artigos.length} artigos + ${resultados.length} resultados + ${tratamentos.length} tratamentos.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
