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

// A tabela pode ter published_at, created_at ou nenhum dos dois —
// usa o que existir, e se não existir nenhum, omite o <lastmod>.
function ultimaData(row) {
  const bruta = row.updated_at || row.published_at || row.created_at || null;
  if (!bruta) return null;
  const d = new Date(bruta);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function urlXml({ loc, lastmod, changefreq, priority }) {
  return [
    "  <url>",
    `    <loc>${loc}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : null,
    priority ? `    <priority>${priority}</priority>` : null,
    "  </url>",
  ].filter(Boolean).join("\n");
}

async function main() {
  const hoje = new Date().toISOString().slice(0, 10);
  const entradas = PAGINAS_FIXAS.map((p) =>
    urlXml({ loc: SITE + p.loc, lastmod: hoje, changefreq: p.changefreq, priority: p.priority })
  );

  const [artigos, tratamentos] = await Promise.all([
    buscarPublicados("articles").catch((e) => { console.error(e.message); return []; }),
    buscarPublicados("treatments").catch((e) => { console.error(e.message); return []; }),
  ]);

  for (const a of artigos) {
    if (!a.slug) continue;
    entradas.push(urlXml({
      loc: `${SITE}/blog/artigos/?slug=${encodeURIComponent(a.slug)}`,
      lastmod: ultimaData(a),
      changefreq: "monthly",
      priority: "0.6",
    }));
  }

  for (const t of tratamentos) {
    if (!t.slug) continue;
    entradas.push(urlXml({
      loc: `${SITE}/tratamentos/detalhe.html?slug=${encodeURIComponent(t.slug)}`,
      lastmod: ultimaData(t),
      changefreq: "monthly",
      priority: "0.7",
    }));
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entradas.join("\n")}\n</urlset>\n`;
  writeFileSync("sitemap.xml", xml, "utf-8");
  console.log(`sitemap.xml gerado com ${PAGINAS_FIXAS.length} páginas fixas + ${artigos.length} artigos + ${tratamentos.length} tratamentos.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
