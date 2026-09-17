import { supabase } from "../../assets/js/supabase-client.js";
import { sanitizeRichHtml, pareceHtml } from "../../assets/js/rich-text.js";
import { safeUrl } from "../../assets/js/sanitize.js";

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
function paragrafar(texto) {
  return texto.split(/\n\s*\n/).map((p) => `<p>${escapeHtml(p.trim())}</p>`).join("");
}
// O conteúdo pode ter sido salvo pelo editor do painel (HTML com
// negrito/itálico/tamanho/alinhamento) ou, para artigos mais antigos, como
// texto simples. Em ambos os casos o visitante nunca deve ver tags soltas.
function renderizarConteudo(texto) {
  return pareceHtml(texto) ? sanitizeRichHtml(texto) : paragrafar(texto);
}

async function carregar() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  const container = document.querySelector("[data-artigo]");
  if (!slug) { container.innerHTML = `<p class="texto-suave">Artigo não encontrado. <a href="/blog/">Voltar</a>.</p>`; return; }

  const { data, error } = await supabase.from("articles").select("*, treatments(name)").eq("slug", slug).eq("published", true).single();
  if (error || !data) { container.innerHTML = `<p class="texto-suave">Artigo não encontrado ou não publicado. <a href="/blog/">Voltar</a>.</p>`; return; }

  document.title = `${data.title} — Especialista em Pele`;
  const dataFormatada = data.published_at ? new Date(data.published_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : "";
  const ctaUrl = data.cta_url ? safeUrl(data.cta_url) : "";
  const ctaHtml = data.cta_label && ctaUrl
    ? `<p class="texto-centro" style="margin-top:28px"><a class="btn btn-dourado" href="${ctaUrl}">${escapeHtml(data.cta_label)}</a></p>`
    : "";

  // ------------------------------------------------------------------
  // Meta tags por artigo (descrição, Open Graph, Twitter Card e
  // canonical). O HTML já vem com placeholders genéricos no <head>;
  // aqui cada artigo publicado sobrescreve com seus próprios dados,
  // sem alterar nada visível na página.
  // ------------------------------------------------------------------
  const tituloCompleto = `${data.title} — Especialista em Pele`;
  const descricaoMeta = (data.excerpt || "").trim() || "Conteúdo educativo sobre saúde da pele — Especialista em Pele.";
  const urlCanonica = `https://www.especialistaempele.com.br/blog/artigos/?slug=${encodeURIComponent(slug)}`;
  const imagemMeta = data.cover_image_url || "https://www.especialistaempele.com.br/assets/hero-fallback.webp";

  document.getElementById("meta-description")?.setAttribute("content", descricaoMeta);
  document.getElementById("og-title")?.setAttribute("content", tituloCompleto);
  document.getElementById("og-description")?.setAttribute("content", descricaoMeta);
  document.getElementById("og-url")?.setAttribute("content", urlCanonica);
  document.getElementById("og-image")?.setAttribute("content", imagemMeta);
  document.getElementById("twitter-title")?.setAttribute("content", tituloCompleto);
  document.getElementById("twitter-description")?.setAttribute("content", descricaoMeta);
  document.getElementById("link-canonical")?.setAttribute("href", urlCanonica);

  // Schema Article com autoria — sinal de E-E-A-T para conteúdo de saúde.
  const schema = document.createElement("script");
  schema.type = "application/ld+json";
  schema.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "headline": data.title,
        "description": descricaoMeta,
        "image": imagemMeta,
        "datePublished": data.published_at || undefined,
        "dateModified": data.updated_at || data.published_at || undefined,
        "author": { "@type": "Person", "name": "Danielle Brito", "url": "https://www.especialistaempele.com.br/quemsomos.html" },
        "publisher": { "@type": "Organization", "name": "Especialista em Pele", "logo": { "@type": "ImageObject", "url": "https://www.especialistaempele.com.br/assets/logo-especialista.webp" } },
        "mainEntityOfPage": urlCanonica,
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Início", "item": "https://www.especialistaempele.com.br/" },
          { "@type": "ListItem", "position": 2, "name": "Conhecimento", "item": "https://www.especialistaempele.com.br/blog/" },
          { "@type": "ListItem", "position": 3, "name": data.title, "item": urlCanonica },
        ],
      },
    ],
  });
  document.head.appendChild(schema);

  container.innerHTML = `
    <p class="card__meta texto-centro">${dataFormatada}${data.treatments ? " · " + data.treatments.name : ""}</p>
    <h1 class="texto-centro">${escapeHtml(data.title)}</h1>
    ${data.cover_image_url ? `<img src="${data.cover_image_url}" alt="${escapeHtml(data.title)}" style="width:100%;border-radius:10px;margin:24px 0" loading="lazy">` : ""}
    <div class="artigo-corpo">${renderizarConteudo(data.content || "")}</div>
    ${ctaHtml}
  `;
}
carregar();
