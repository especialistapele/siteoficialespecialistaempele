// ============================================================
// Gera UMA página HTML estática por artigo do blog publicado,
// em /blog/<slug>.html (buscados direto no Supabase), no mesmo
// esquema de scripts/gerar-paginas-tratamentos.mjs.
//
//   1 artigo publicado = 1 página estática com SEO próprio.
//
// O que este script também faz (veja scripts/lib/conteudo.mjs):
//  - artigo despublicado/excluído  -> a página é apagada (404)
//  - slug alterado                 -> a URL antiga vira redirecionamento
//                                     para a nova (mesmo ID BLOG-xxxxxx)
//  - URL antiga /blog/artigos/<slug>.html -> redirecionamento para /blog/<slug>.html
//  - atualiza a listagem estática em /blog/index.html (links internos
//    rastreáveis pelo Google, sem depender de JavaScript)
//
// Roda pelo GitHub Actions (.github/workflows/atualizar-sitemap.yml)
// e também manualmente:
//
//   SUPABASE_URL=... SUPABASE_ANON_KEY=... node scripts/gerar-paginas-artigos.mjs
// ============================================================

import {
  SITE, SUPABASE_ANON_KEY, slugifyUrl, escapeHtml, dataBR, dataISO, urlSegura, renderizarConteudo,
  textoPuro, resumir, buscar, dimensoesImagem, attrDim, cabecalho, rodape, marcadorId,
  sincronizarPastas, injetarLista,
} from "./lib/conteudo.mjs";

export { slugifyUrl };

const PASTA = "blog";
const PASTA_LEGADA = "blog/artigos"; // URL antiga das páginas estáticas de artigo
const AUTOR = { "@type": "Person", name: "Danielle Brito", url: `${SITE}/quemsomos.html` };
const EDITORA = {
  "@type": "Organization", name: "Especialista em Pele", url: `${SITE}/`,
  logo: { "@type": "ImageObject", url: `${SITE}/assets/logo-especialista.webp` },
};

export async function buscarArtigosPublicados() {
  return buscar("articles?select=*,treatments(name,slug)&published=eq.true&order=published_at.desc");
}

export function urlDoArtigo(a) { return `${SITE}/blog/${a.slug}.html`; }

function cardArtigo(a) {
  const img = urlSegura(a.cover_image_url);
  return `<article class="card"><div class="card__img">${img ? `<img src="${escapeHtml(img)}" alt="${escapeHtml(a.title)}" style="width:100%;height:100%;object-fit:cover" loading="lazy">` : ""}</div><div class="card__corpo"><span class="card__meta">${escapeHtml(dataBR(a.published_at))}</span><h3>${escapeHtml(a.title)}</h3><p>${escapeHtml(a.excerpt)}</p><a class="card__link" href="/blog/${escapeHtml(a.slug)}.html">Ler artigo →</a></div></article>`;
}

export function paginaHtml(a, { relacionados = [], dimCapa = null } = {}) {
  const tituloCompleto = `${a.title} — Especialista em Pele`;
  const corpo = renderizarConteudo(a.content || "");
  const descricaoMeta = resumir((a.excerpt || "").trim() || textoPuro(corpo) || "Conteúdo educativo sobre saúde da pele — Especialista em Pele.");
  const urlCanonica = urlDoArtigo(a);
  const capa = urlSegura(a.cover_image_url);
  const imagemMeta = capa || `${SITE}/assets/hero-fallback.webp`;
  const altCapa = `Imagem de capa do artigo: ${a.title}`;
  const publicado = dataISO(a.published_at);
  const modificado = dataISO(a.updated_at) || publicado;
  const trat = a.treatments || null;
  const ctaUrl = a.cta_url ? urlSegura(a.cta_url, { relativa: true }) : "";
  const ctaHtml = a.cta_label && ctaUrl
    ? `<p class="texto-centro" style="margin-top:28px"><a class="btn btn-dourado" href="${escapeHtml(ctaUrl)}">${escapeHtml(a.cta_label)}</a></p>` : "";

  const imagemSchema = capa
    ? { "@type": "ImageObject", url: capa, contentUrl: capa, caption: altCapa, ...(dimCapa ? { width: dimCapa.w, height: dimCapa.h } : {}) }
    : `${SITE}/assets/hero-fallback.webp`;

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${urlCanonica}#artigo`,
        identifier: a.public_id || undefined,
        headline: a.title.slice(0, 110),
        description: descricaoMeta,
        image: imagemSchema,
        datePublished: publicado,
        dateModified: modificado,
        author: AUTOR,
        publisher: EDITORA,
        inLanguage: "pt-BR",
        isAccessibleForFree: true,
        articleSection: trat?.name || undefined,
        wordCount: textoPuro(corpo).split(/\s+/).filter(Boolean).length,
        mainEntityOfPage: { "@type": "WebPage", "@id": urlCanonica },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Início", item: `${SITE}/` },
          { "@type": "ListItem", position: 2, name: "Conhecimento", item: `${SITE}/blog/` },
          { "@type": "ListItem", position: 3, name: a.title, item: urlCanonica },
        ],
      },
    ],
  };

  const dataTxt = dataBR(a.published_at);
  const atualizadoTxt = dataBR(a.updated_at);
  const mostrarAtualizacao = a.updated_at && a.published_at && atualizadoTxt && atualizadoTxt !== dataTxt;

  const maisLinks = [
    trat?.slug ? `<li><a href="/tratamentos/${escapeHtml(slugifyUrl(trat.slug))}.html">Conheça o tratamento: ${escapeHtml(trat.name)}</a></li>` : "",
    trat?.slug ? `<li><a href="/resultados/">Veja resultados reais de ${escapeHtml(trat.name)}</a></li>` : `<li><a href="/resultados/">Veja resultados reais</a></li>`,
    ...relacionados.map((r) => `<li><a href="/blog/${escapeHtml(r.slug)}.html">${escapeHtml(r.title)}</a></li>`),
  ].filter(Boolean).join("");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(tituloCompleto)}</title>
${marcadorId(a.public_id)}
<meta name="description" content="${escapeHtml(descricaoMeta)}">
<meta name="author" content="Danielle Brito">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<meta property="og:type" content="article">
<meta property="og:title" content="${escapeHtml(tituloCompleto)}">
<meta property="og:description" content="${escapeHtml(descricaoMeta)}">
<meta property="og:site_name" content="Especialista em Pele">
<meta property="og:url" content="${urlCanonica}">
<meta property="og:image" content="${escapeHtml(imagemMeta)}">
${capa ? `<meta property="og:image:alt" content="${escapeHtml(altCapa)}">` : ""}
${capa && dimCapa ? `<meta property="og:image:width" content="${dimCapa.w}">\n<meta property="og:image:height" content="${dimCapa.h}">` : ""}
<meta property="og:locale" content="pt_BR">
${publicado ? `<meta property="article:published_time" content="${publicado}">` : ""}
${modificado ? `<meta property="article:modified_time" content="${modificado}">` : ""}
<meta property="article:author" content="Danielle Brito">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(tituloCompleto)}">
<meta name="twitter:description" content="${escapeHtml(descricaoMeta)}">
<meta name="twitter:image" content="${escapeHtml(imagemMeta)}">
<link rel="canonical" href="${urlCanonica}">
<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>
<link rel="stylesheet" href="/assets/css/paginas.css">
<link rel="stylesheet" href="/assets/css/mobile-nav.css">
<style>.artigo-corpo p{font-size:17px;line-height:1.7;margin-bottom:18px}.artigo-corpo h2{margin:34px 0 12px}.artigo-corpo h3{margin:26px 0 10px}.artigo-corpo ul,.artigo-corpo ol{margin:0 0 18px 22px;font-size:17px;line-height:1.7}.artigo-mais ul{margin:12px 0 0 20px;line-height:1.9}</style>
<link rel="icon" href="/assets/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="512x512" href="/assets/favicon-512.png">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
</head>
<body data-pagina="blog">
${cabecalho("blog")}
<main>
  <nav class="wrap breadcrumb" aria-label="Você está em"><a href="/">Início</a> &gt; <a href="/blog/">Conhecimento</a> &gt; <span>${escapeHtml(a.title)}</span></nav>
  <article class="secao wrap" style="max-width:70ch">
    <p class="card__meta texto-centro">${dataTxt ? `Publicado em <time datetime="${publicado}">${escapeHtml(dataTxt)}</time>` : ""}${mostrarAtualizacao ? ` · Atualizado em <time datetime="${modificado}">${escapeHtml(atualizadoTxt)}</time>` : ""}${trat ? " · " + escapeHtml(trat.name) : ""}</p>
    <h1 class="texto-centro">${escapeHtml(a.title)}</h1>
    <p class="card__meta texto-centro">Por <a href="/quemsomos.html" rel="author">Danielle Brito</a> — Especialista em Pele</p>
    ${capa ? `<img src="${escapeHtml(capa)}" alt="${escapeHtml(altCapa)}"${attrDim(dimCapa)} style="width:100%;height:auto;border-radius:10px;margin:24px 0" fetchpriority="high" decoding="async">` : ""}
    <div class="artigo-corpo">${corpo}</div>
    ${ctaHtml}
    <aside class="artigo-mais" style="margin-top:44px"><h2 style="font-size:1.25rem">Continue explorando</h2><ul>${maisLinks}</ul></aside>
  </article>
  <section class="secao fundo-escura texto-centro">
    <div class="wrap">
      <h2>Ficou com alguma dúvida sobre sua pele?</h2>
      <a class="btn btn-claro" data-whatsapp-link href="#" style="margin-top:16px">Falar no WhatsApp</a>
    </div>
  </section>
</main>
${rodape()}
</body>
</html>
`;
}

export async function gerar({ log = console.log } = {}) {
  const artigos = (await buscarArtigosPublicados()).filter((a) => a.public_id && a.slug);

  const itens = [];
  for (const a of artigos) {
    const relacionados = artigos
      .filter((o) => o.id !== a.id)
      .sort((x, y) => (Number(y.treatment_id === a.treatment_id && !!a.treatment_id) - Number(x.treatment_id === a.treatment_id && !!a.treatment_id)))
      .slice(0, 3);
    const dimCapa = await dimensoesImagem(urlSegura(a.cover_image_url));
    itens.push({ id: a.public_id, slug: a.slug, html: paginaHtml(a, { relacionados, dimCapa }) });
  }

  // arquivos antigos de /blog/artigos/<slug>.html (sem marcador) -> reconhecidos pelo slug
  const idPorSlug = new Map(artigos.map((a) => [a.slug, a.public_id]));
  const rel = sincronizarPastas({
    pastas: [PASTA, PASTA_LEGADA], urlBase: `${SITE}/blog`, itens,
    resolverLegado: (slug) => idPorSlug.get(slug) || null, log,
  });

  const lista = artigos.length
    ? artigos.map(cardArtigo).join("")
    : `<p class="texto-suave">Nenhum artigo publicado no momento.</p>`;
  if (injetarLista(`${PASTA}/index.html`, lista)) log(`Listagem estática de /blog/ atualizada (${artigos.length} artigo(s)).`);

  log(`\n${itens.length} página(s) de artigo em /${PASTA}/.`);
  return rel;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (!SUPABASE_ANON_KEY) { console.error("Faltou a variável de ambiente SUPABASE_ANON_KEY."); process.exit(1); }
  gerar().then((rel) => { if (rel.erros.length) { console.error("\nERROS:\n" + rel.erros.join("\n")); process.exit(1); } })
    .catch((e) => { console.error(e); process.exit(1); });
}
