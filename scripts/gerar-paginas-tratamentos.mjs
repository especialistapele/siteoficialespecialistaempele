// ============================================================
// Gera uma página HTML estática e completa para cada tratamento
// publicado (buscados direto no Supabase), em vez de depender de
// JavaScript no navegador para montar título, texto e SEO.
//
// Por quê: /tratamentos/detalhe.html?slug=... monta o conteúdo
// via JavaScript, depois que a página já carregou. Isso significa
// que o HTML que o Google recebe primeiro está vazio — sem título
// específico, sem texto, sem dados estruturados. Esse script
// resolve isso gerando, em tempo de build, um arquivo .html por
// tratamento já com tudo pronto.
//
// Roda automaticamente pelo GitHub Actions (veja
// .github/workflows/atualizar-sitemap.yml), mas também pode ser
// executado manualmente:
//
//   SUPABASE_URL=... SUPABASE_ANON_KEY=... node scripts/gerar-paginas-tratamentos.mjs
//
// Não precisa de nenhuma dependência além do Node 18+ (usa o
// fetch nativo). As páginas antigas (/tratamentos/detalhe.html?slug=...)
// continuam funcionando normalmente — este script só passa a
// gerar, além delas, uma versão estática em /tratamentos/<slug>.html.
// ============================================================

import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";

const SITE = "https://www.especialistaempele.com.br";
const SUPABASE_URL = process.env.SUPABASE_URL || "https://clwaotfbqwvxpykruwed.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const PASTA_SAIDA = "tratamentos";

// Mesma regra de slug usada em assets/js/tratamentos-data.js e em
// scripts/gerar-sitemap.mjs — precisa ficar idêntica nos três lugares,
// senão os links quebram.
export function slugifyUrl(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

// Espelha renderizarOrientacao() de tratamentos/tratamento-data.js:
// se o texto salvo já parece HTML (produzido pelo editor do painel),
// usa como está; se for texto simples antigo, escapa e separa em <p>.
function pareceHtml(valor) {
  return /<\/?[a-z][\s\S]*>/i.test(String(valor ?? ""));
}
function paragrafar(texto) {
  return texto.split(/\n\s*\n/).map((p) => `<p>${escapeHtml(p.trim())}</p>`).join("");
}
function renderizarOrientacao(texto) {
  return pareceHtml(texto) ? String(texto ?? "") : paragrafar(String(texto ?? ""));
}

async function buscarPublicados(tabela) {
  const url = `${SUPABASE_URL}/rest/v1/${tabela}?select=*&published=eq.true`;
  const resp = await fetch(url, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  });
  if (!resp.ok) throw new Error(`Erro ao buscar "${tabela}": ${resp.status} ${await resp.text()}`);
  return resp.json();
}

export function paginaHtml(t) {
  const slugArquivo = slugifyUrl(t.slug);
  const tituloCompleto = `${t.name} — Especialista em Pele`;
  const resumoBruto = (t.summary || t.description || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const descricaoMeta = (resumoBruto.slice(0, 155) || "Tratamento regenerativo — Especialista em Pele.");
  const urlCanonica = `${SITE}/tratamentos/${slugArquivo}.html`;
  const imagemMeta = t.cover_image_url || `${SITE}/assets/hero-fallback.webp`;
  const ctaHtml = t.cta_label && t.cta_url
    ? `<p class="texto-centro" style="margin-top:28px"><a class="btn btn-dourado" href="${escapeHtml(t.cta_url)}">${escapeHtml(t.cta_label)}</a></p>`
    : "";

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: t.name,
        description: descricaoMeta,
        image: imagemMeta,
        url: urlCanonica,
        provider: { "@type": "Person", name: "Danielle Brito" },
        areaServed: ["Araruama", "Cabo Frio", "Copacabana", "Brasil"],
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Início", item: `${SITE}/` },
          { "@type": "ListItem", position: 2, name: "Tratamentos", item: `${SITE}/tratamentos/` },
          { "@type": "ListItem", position: 3, name: t.name, item: urlCanonica },
        ],
      },
    ],
  };

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<!-- AUTO-GENERATED:TREATMENT-PAGE -->
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(tituloCompleto)}</title>
<meta name="description" content="${escapeHtml(descricaoMeta)}">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<meta property="og:type" content="website">
<meta property="og:title" content="${escapeHtml(tituloCompleto)}">
<meta property="og:description" content="${escapeHtml(descricaoMeta)}">
<meta property="og:site_name" content="Especialista em Pele">
<meta property="og:url" content="${urlCanonica}">
<meta property="og:image" content="${escapeHtml(imagemMeta)}">
<meta property="og:locale" content="pt_BR">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(tituloCompleto)}">
<meta name="twitter:description" content="${escapeHtml(descricaoMeta)}">
<meta name="twitter:image" content="${escapeHtml(imagemMeta)}">
<link rel="canonical" href="${urlCanonica}">
<script type="application/ld+json">${JSON.stringify(schema)}</script>
<link rel="stylesheet" href="/assets/css/paginas.css">
<link rel="stylesheet" href="/assets/css/mobile-nav.css">
<style>.artigo-corpo p{font-size:17px;line-height:1.7;margin-bottom:18px}</style>
<link rel="icon" href="/assets/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="512x512" href="/assets/favicon-512.png">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
</head>
<body data-pagina="tratamentos">
<header class="site-nav-interna">
  <div class="nav-inner-interna">
    <a href="/" class="logo-interna"><img src="/assets/logo-especialista.webp" alt="Especialista em Pele"></a>
    <button type="button" class="nav-toggle" aria-label="Abrir menu" aria-expanded="false" aria-controls="menu-principal"><span></span><span></span><span></span></button>
    <nav class="nav-links-interna" id="menu-principal" aria-label="Menu principal">
      <a href="/pele.html">A Pele</a>
      <a href="/quemsomos.html">Quem Somos</a>
      <a href="/tratamentos/" aria-current="page">Regeneração</a>
      <a href="/nanotecnologia.html">Nanotecnologia</a>
      <a href="/blog/">Conhecimento</a>
      <a href="/contato.html">Consulta</a>
    </nav>
    <a class="nav-login-interna" href="/painel/">Login Paciente</a>
  </div>
</header>
<main>
  <nav class="wrap breadcrumb"><a href="/">Início</a> &gt; <a href="/tratamentos/">Tratamentos</a> &gt; <span>${escapeHtml(t.name)}</span></nav>
  <article class="secao wrap" style="max-width:70ch">
    <p class="card__meta texto-centro">Tratamento regenerativo</p>
    <h1 class="texto-centro">${escapeHtml(t.name)}</h1>
    ${t.cover_image_url ? `<img src="${escapeHtml(t.cover_image_url)}" alt="${escapeHtml(t.name)}" style="width:100%;border-radius:10px;margin:24px 0" loading="lazy">` : ""}
    <div class="artigo-corpo">${renderizarOrientacao(t.description || t.summary || "")}</div>
    ${ctaHtml}
  </article>
  <section class="secao fundo-escura texto-centro">
    <div class="wrap">
      <h2>Vamos conversar sobre o seu caso?</h2>
      <a class="btn btn-claro" data-whatsapp-link href="#" style="margin-top:16px">Falar no WhatsApp</a>
    </div>
  </section>
</main>
<footer class="site-footer">
  <div class="footer-inner">
    <div class="footer-grid">
      <div class="footer-col">
        <a class="footer-brand" href="/"><img class="footer-logo" src="/assets/logo-especialista.webp" alt="Especialista em Pele"></a>
        <p class="footer-tagline">Araruama • Cabo Frio • Copacabana • Todo Brasil — Consultoria Regenerativa</p>
        <div class="footer-social">
          <a href="https://instagram.com/especialistaempele" target="_blank" rel="noopener" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17" cy="7" r="0.8" fill="currentColor" stroke="none"/></svg></a>
          <a data-whatsapp-link href="#" aria-label="WhatsApp"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M20.5 11.9a8.4 8.4 0 1 1-3.6-6.9L20.5 4l-1 3.4a8.3 8.3 0 0 1 1 4.5Z" stroke-linecap="round" stroke-linejoin="round"/><path d="M8.3 8.3c-.3 1 .4 2.6 1.5 3.9 1.2 1.4 2.7 2.2 3.9 2.1.5 0 1.4-.5 1.6-1l.2-.7-2-1-.5.7c-.9-.2-1.7-.8-2.3-1.6L11.4 10l-1-2-.7.1c-.6.1-1.2.6-1.4 1.2Z" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
        </div>
      </div>
      <div class="footer-col"><h4>Navegação</h4><ul><li><a href="/pele.html">A Pele</a></li><li><a href="/quemsomos.html">Quem Somos</a></li><li><a href="/tratamentos/">Regeneração</a></li><li><a href="/blog/">Conhecimento</a></li><li><a href="/resultados/">Resultados</a></li></ul></div>
      <div class="footer-col"><h4>Institucional</h4><ul><li><a href="/depoimentos.html">Depoimentos</a></li><li><a href="/pre-atendimento/">Pré-atendimento</a></li><li><a href="/privacidade.html">Política de Privacidade</a></li><li><a href="/cookies.html">Política de Cookies</a></li>
<li><a href="/consultoriaonline.html">Consultoria Online</a></li></ul></div>
      <div class="footer-col"><h4>Contato</h4><ul><li><a data-whatsapp-link href="#">(21) 99219-7518</a></li><li><a href="https://instagram.com/especialistaempele" target="_blank" rel="noopener">@especialistaempele</a></li><li><a href="/estetica-regenerativa-araruama.html">Araruama</a></li><li><a href="/estetica-regenerativa-cabo-frio-riviera.html">Cabo Frio/Riviera</a></li><li><a href="/estetica-regenerativa-copacabana.html">Copacabana</a></li></ul></div>
    </div>
    <p class="footer-base">© 2026 Especialista em Pele — Todos os direitos reservados — Feito por Yansix com <span class="coracao">♥</span></p>
  </div>
</footer>
<a class="whatsapp-flutuante" data-whatsapp-link href="#" aria-label="Falar no WhatsApp"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M20.5 11.9a8.4 8.4 0 1 1-3.6-6.9L20.5 4l-1 3.4a8.3 8.3 0 0 1 1 4.5Z" stroke-linecap="round" stroke-linejoin="round"/><path d="M8.3 8.3c-.3 1 .4 2.6 1.5 3.9 1.2 1.4 2.7 2.2 3.9 2.1.5 0 1.4-.5 1.6-1l.2-.7-2-1-.5.7c-.9-.2-1.7-.8-2.3-1.6L11.4 10l-1-2-.7.1c-.6.1-1.2.6-1.4 1.2Z" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
<div class="cookie-banner" data-cookie-banner>
  <p>Usamos cookies para melhorar sua experiência. <a href="/cookies.html">Saiba mais</a>.</p>
  <div class="cookie-banner__acoes"><button class="btn btn-dourado" data-cookie-aceitar>Aceitar</button><button class="btn btn-fora" data-cookie-recusar>Recusar</button></div>
</div>
<script src="/assets/js/whatsapp.js" defer></script>
<script type="module" src="/assets/js/cookies.js"></script>
<script src="/assets/js/mobile-nav.js" defer></script>
</body>
</html>
`;
}

async function main() {
  if (!SUPABASE_ANON_KEY) {
    console.error("Faltou a variável de ambiente SUPABASE_ANON_KEY.");
    process.exit(1);
  }
  const tratamentos = await buscarPublicados("treatments");
  mkdirSync(PASTA_SAIDA, { recursive: true });

  const vistos = new Set();
  for (const t of tratamentos) {
    if (!t.slug) continue;
    const slugArquivo = slugifyUrl(t.slug);
    if (!slugArquivo) continue;
    if (vistos.has(slugArquivo)) {
      console.warn(`Aviso: slug duplicado após normalização: "${t.slug}" -> ${slugArquivo}.html (pulando).`);
      continue;
    }
    vistos.add(slugArquivo);
    const caminho = `${PASTA_SAIDA}/${slugArquivo}.html`;
    if (existsSync(caminho)) {
      const existente = readFileSync(caminho, "utf-8");
      if (!existente.includes("AUTO-GENERATED:TREATMENT-PAGE")) {
        console.warn(`Preservado (página HTML manual/SEO): ${caminho}`);
        continue;
      }
    }
    writeFileSync(caminho, paginaHtml(t), "utf-8");
    console.log(`Gerado: ${caminho}`);
  }
  console.log(`\n${vistos.size} página(s) de tratamento geradas em /${PASTA_SAIDA}/.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
