// ============================================================
// Gera UMA página HTML estática por resultado publicado, em
// /resultados/<slug>.html (buscados direto no Supabase), no mesmo
// esquema de scripts/gerar-paginas-tratamentos.mjs.
//
//   1 resultado publicado (com consentimento) = 1 página estática.
//
// Todas as fotos do resultado entram na página: antes, depois e
// as extras cadastradas em result_images. Cada foto sai com URL
// acessível, alt descritivo, width/height, loading otimizado,
// legenda e ImageObject no Schema.org (Google Imagens).
//
// Despublicado / consentimento revogado / excluído -> a página é
// apagada (404). Slug alterado -> a URL antiga vira redirecionamento.
// A listagem estática de /resultados/ também é atualizada aqui.
//
//   SUPABASE_URL=... SUPABASE_ANON_KEY=... node scripts/gerar-paginas-resultados.mjs
// ============================================================

import {
  SITE, SUPABASE_ANON_KEY, slugifyUrl, escapeHtml, dataBR, dataISO, urlSegura, renderizarConteudo,
  textoPuro, resumir, buscar, dimensoesImagem, attrDim, cabecalho, rodape, marcadorId,
  sincronizarPastas, injetarLista,
} from "./lib/conteudo.mjs";

export { slugifyUrl };

const PASTA = "resultados";
const EDITORA = {
  "@type": "Organization", name: "Especialista em Pele", url: `${SITE}/`,
  logo: { "@type": "ImageObject", url: `${SITE}/assets/logo-especialista.webp` },
};
const AVISO = "Imagem publicada com consentimento expresso da paciente. Os resultados variam de pessoa para pessoa.";

export async function buscarResultadosPublicados() {
  // A política de leitura pública (RLS) já entrega só published=true e consent_confirmed=true;
  // os filtros abaixo deixam a regra explícita no código.
  const [resultados, extras] = await Promise.all([
    buscar("results?select=*,treatments(name,slug)&published=eq.true&consent_confirmed=eq.true&order=published_at.desc.nullslast,created_at.desc"),
    buscar("result_images?select=*&order=position.asc,created_at.asc"),
  ]);
  const porResultado = new Map();
  for (const im of extras) {
    if (!porResultado.has(im.result_id)) porResultado.set(im.result_id, []);
    porResultado.get(im.result_id).push(im);
  }
  return resultados.filter((r) => r.public_id && r.slug).map((r) => ({ ...r, extras: porResultado.get(r.id) || [] }));
}

export const urlDoResultado = (r) => `${SITE}/resultados/${r.slug}.html`;

// Lista ordenada de TODAS as fotos do resultado (antes, depois, extras).
export function fotosDoResultado(r) {
  const fotos = [];
  const antes = urlSegura(r.before_image_url), depois = urlSegura(r.after_image_url);
  if (antes) fotos.push({ chave: "antes", url: antes, alt: `Antes do tratamento — ${r.title}`, legenda: "Antes" });
  if (depois) fotos.push({ chave: "depois", url: depois, alt: `Depois do tratamento — ${r.title}`, legenda: "Depois" });
  (r.extras || []).forEach((e, i) => {
    const url = urlSegura(e.url);
    if (!url) return;
    fotos.push({ chave: `extra-${i + 1}`, url, alt: (e.alt || "").trim() || `${r.title} — foto ${i + 1}`, legenda: (e.caption || "").trim() || (e.alt || "").trim() || `Foto ${i + 1}` });
  });
  return fotos;
}

function cardResultado(r) {
  const antes = urlSegura(r.before_image_url), depois = urlSegura(r.after_image_url);
  const slider = antes && depois
    ? `<div class="antes-depois-slider" data-antes-depois><img class="ad-depois" src="${escapeHtml(depois)}" alt="Depois — ${escapeHtml(r.title)}"><img class="ad-antes" src="${escapeHtml(antes)}" alt="Antes — ${escapeHtml(r.title)}"><span class="ad-tag ad-tag-antes">Antes</span><span class="ad-tag ad-tag-depois">Depois</span><div class="ad-handle"><span class="ad-handle-grip"></span></div></div>` : "";
  return `<article class="card">${slider}<div class="card__corpo">${r.treatments ? `<span class="selo">${escapeHtml(r.treatments.name)}</span>` : ""}<h3>${escapeHtml(r.title)}</h3><p>${escapeHtml(r.description)}</p><a class="card__link" href="/resultados/${escapeHtml(r.slug)}.html">Ver caso completo →</a></div></article>`;
}

export function paginaHtml(r, { fotos, dims, outros = [] }) {
  const trat = r.treatments || null;
  const urlCanonica = urlDoResultado(r);
  // evita "Resultado … — Resultado real" quando o título já começa com "Resultado"
  const tituloCompleto = /^resultado/i.test(r.title)
    ? `${r.title} | Especialista em Pele`
    : `${r.title} — Resultado real | Especialista em Pele`;
  const corpoTexto = (r.content || "").trim();
  const descricaoMeta = resumir(
    [r.title, (r.description || "").trim() || textoPuro(corpoTexto)].filter(Boolean).join(". ").replace(/\.\.+/g, ".") +
    ". Resultado real, com consentimento da paciente."
  );
  const publicado = dataISO(r.published_at || r.created_at);
  const modificado = dataISO(r.updated_at) || publicado;
  const principal = fotos.find((f) => f.chave === "depois") || fotos[0];
  const imagemMeta = principal?.url || `${SITE}/assets/og-image.jpg`;
  const dimMeta = principal ? dims.get(principal.url) : null;
  const antes = fotos.find((f) => f.chave === "antes"), depois = fotos.find((f) => f.chave === "depois");

  const objetosImagem = fotos.map((f) => {
    const d = dims.get(f.url);
    return {
      "@type": "ImageObject", contentUrl: f.url, url: f.url, name: f.legenda === "Antes" || f.legenda === "Depois" ? `${f.legenda} — ${r.title}` : f.legenda,
      caption: f.alt, description: f.alt, ...(d ? { width: d.w, height: d.h } : {}),
      uploadDate: publicado, creditText: "Especialista em Pele", creator: EDITORA,
      representativeOfPage: f === principal || undefined,
    };
  });

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["WebPage", "ImageGallery"],
        "@id": `${urlCanonica}#resultado`,
        identifier: r.public_id,
        name: r.title,
        headline: r.title,
        description: descricaoMeta,
        url: urlCanonica,
        inLanguage: "pt-BR",
        datePublished: publicado,
        dateModified: modificado,
        about: trat ? { "@type": "Thing", name: trat.name } : undefined,
        author: EDITORA,
        publisher: EDITORA,
        isPartOf: { "@type": "CollectionPage", name: "Resultados — Especialista em Pele", url: `${SITE}/resultados/` },
        primaryImageOfPage: objetosImagem.find((o) => o.representativeOfPage),
        image: objetosImagem.map((o) => o.contentUrl),
        associatedMedia: objetosImagem,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Início", item: `${SITE}/` },
          { "@type": "ListItem", position: 2, name: "Resultados", item: `${SITE}/resultados/` },
          { "@type": "ListItem", position: 3, name: r.title, item: urlCanonica },
        ],
      },
    ],
  };

  const slider = antes && depois
    ? `<div class="antes-depois-slider" data-antes-depois role="img" aria-label="Comparação antes e depois: ${escapeHtml(r.title)}. Arraste para os lados." style="max-width:520px;margin:24px auto">
        <img class="ad-depois" src="${escapeHtml(depois.url)}" alt=""${attrDim(dims.get(depois.url))} decoding="async" fetchpriority="high">
        <img class="ad-antes" src="${escapeHtml(antes.url)}" alt=""${attrDim(dims.get(antes.url))} decoding="async">
        <span class="ad-tag ad-tag-antes">Antes</span><span class="ad-tag ad-tag-depois">Depois</span>
        <div class="ad-handle"><span class="ad-handle-grip"></span></div>
      </div>
      <p class="texto-suave texto-centro" style="font-size:13px;margin-top:-8px">Arraste a foto para os lados para comparar o antes e o depois.</p>` : "";

  const galeria = fotos.map((f, i) => `<figure style="margin:0"><img src="${escapeHtml(f.url)}" alt="${escapeHtml(f.alt)}"${attrDim(dims.get(f.url))} loading="${i < 2 ? "eager" : "lazy"}" decoding="async" style="width:100%;height:auto;border-radius:10px"><figcaption class="card__meta" style="margin-top:8px">${escapeHtml(f.legenda)}</figcaption></figure>`).join("\n      ");

  const corpo = corpoTexto ? renderizarConteudo(corpoTexto) : "";
  const linkTrat = trat?.slug ? `${SITE}/tratamentos/${slugifyUrl(trat.slug)}.html` : "";
  const outrosHtml = outros.length
    ? `<h2 style="font-size:1.25rem;margin-top:44px">Outros resultados${trat ? ` de ${escapeHtml(trat.name)}` : ""}</h2><ul style="margin:12px 0 0 20px;line-height:1.9">${outros.map((o) => `<li><a href="/resultados/${escapeHtml(o.slug)}.html">${escapeHtml(o.title)}</a></li>`).join("")}</ul>` : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(tituloCompleto)}</title>
${marcadorId(r.public_id)}
<meta name="description" content="${escapeHtml(descricaoMeta)}">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<meta property="og:type" content="article">
<meta property="og:title" content="${escapeHtml(tituloCompleto)}">
<meta property="og:description" content="${escapeHtml(descricaoMeta)}">
<meta property="og:site_name" content="Especialista em Pele">
<meta property="og:url" content="${urlCanonica}">
<meta property="og:image" content="${escapeHtml(imagemMeta)}">
${principal ? `<meta property="og:image:alt" content="${escapeHtml(principal.alt)}">` : ""}
${dimMeta ? `<meta property="og:image:width" content="${dimMeta.w}">\n<meta property="og:image:height" content="${dimMeta.h}">` : ""}
<meta property="og:locale" content="pt_BR">
${publicado ? `<meta property="article:published_time" content="${publicado}">` : ""}
${modificado ? `<meta property="article:modified_time" content="${modificado}">` : ""}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(tituloCompleto)}">
<meta name="twitter:description" content="${escapeHtml(descricaoMeta)}">
<meta name="twitter:image" content="${escapeHtml(imagemMeta)}">
<link rel="canonical" href="${urlCanonica}">
<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>
<link rel="stylesheet" href="/assets/css/paginas.css">
<link rel="stylesheet" href="/assets/css/antes-depois-slider.css">
<link rel="stylesheet" href="/assets/css/mobile-nav.css">
<style>.resultado-corpo p{font-size:17px;line-height:1.7;margin-bottom:18px}.galeria-caso{display:grid;gap:18px;grid-template-columns:1fr}@media(min-width:640px){.galeria-caso{grid-template-columns:repeat(2,1fr)}}</style>
<link rel="icon" href="/assets/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="512x512" href="/assets/favicon-512.png">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
</head>
<body data-pagina="resultados">
${cabecalho("resultados")}
<main>
  <nav class="wrap breadcrumb" aria-label="Você está em"><a href="/">Início</a> &gt; <a href="/resultados/">Resultados</a> &gt; <span>${escapeHtml(r.title)}</span></nav>
  <article class="secao wrap" style="max-width:76ch">
    <p class="card__meta texto-centro">${trat ? `<span class="selo">${escapeHtml(trat.name)}</span> ` : ""}${publicado ? `<time datetime="${publicado}">${escapeHtml(dataBR(r.published_at || r.created_at))}</time>` : ""}</p>
    <h1 class="texto-centro">${escapeHtml(r.title)}</h1>
    ${slider}
    ${r.description ? `<p class="texto-centro" style="font-size:18px;line-height:1.6">${escapeHtml(r.description)}</p>` : ""}
    <h2 style="margin-top:36px">Sobre este resultado</h2>
    <div class="resultado-corpo">${corpo || `<p>Registro fotográfico de um caso${trat ? ` de ${escapeHtml(trat.name)}` : ""} atendido na Especialista em Pele${r.description ? `: ${escapeHtml(r.description.replace(/[.\s]+$/, ""))}` : ""}.</p>`}<p class="texto-suave" style="font-size:14px">${AVISO}</p></div>
    <h2 style="margin-top:36px">Fotos do caso</h2>
    <div class="galeria-caso">
      ${galeria}
    </div>
    <h2 style="margin-top:44px">${trat ? "Tratamento realizado" : "Quer um resultado assim?"}</h2>
    <p>${linkTrat ? `Saiba como funciona o tratamento: <a href="/tratamentos/${escapeHtml(slugifyUrl(trat.slug))}.html">${escapeHtml(trat.name)}</a>. ` : ""}Conheça também outros <a href="/resultados/">resultados reais</a> e os <a href="/blog/">conteúdos sobre saúde da pele</a>.</p>
    ${outrosHtml}
  </article>
  <section class="secao fundo-escura texto-centro">
    <div class="wrap">
      <h2>Quer entender o que é possível para a sua pele?</h2>
      <a class="btn btn-claro" data-whatsapp-link href="#" style="margin-top:16px">Falar no WhatsApp</a>
    </div>
  </section>
</main>
${rodape()}
<script type="module">import { initAntesDepoisSlider } from "/assets/js/antes-depois-slider.js"; initAntesDepoisSlider(document);</script>
</body>
</html>
`;
}

export async function gerar({ log = console.log } = {}) {
  const resultados = await buscarResultadosPublicados();

  // dimensões de todas as fotos (uma vez por URL)
  const dims = new Map();
  for (const r of resultados) for (const f of fotosDoResultado(r)) if (!dims.has(f.url)) dims.set(f.url, await dimensoesImagem(f.url));

  const itens = resultados.map((r) => {
    const mesmos = resultados.filter((o) => o.id !== r.id && r.treatment_id && o.treatment_id === r.treatment_id);
    const outros = mesmos.slice(0, 4);
    return { id: r.public_id, slug: r.slug, html: paginaHtml(r, { fotos: fotosDoResultado(r), dims, outros }) };
  });

  const rel = sincronizarPastas({ pastas: [PASTA], urlBase: `${SITE}/resultados`, itens, log });

  const lista = resultados.length
    ? resultados.map(cardResultado).join("")
    : `<p class="texto-suave">Em breve, resultados documentados com consentimento das pacientes.</p>`;
  if (injetarLista(`${PASTA}/index.html`, lista)) log(`Listagem estática de /resultados/ atualizada (${resultados.length} resultado(s)).`);

  log(`\n${itens.length} página(s) de resultado em /${PASTA}/.`);
  return rel;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (!SUPABASE_ANON_KEY) { console.error("Faltou a variável de ambiente SUPABASE_ANON_KEY."); process.exit(1); }
  gerar().then((rel) => { if (rel.erros.length) { console.error("\nERROS:\n" + rel.erros.join("\n")); process.exit(1); } })
    .catch((e) => { console.error(e); process.exit(1); });
}
