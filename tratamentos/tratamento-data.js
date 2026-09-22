import { supabase } from "../assets/js/supabase-client.js";
import { sanitizeRichHtml, pareceHtml } from "../assets/js/rich-text.js";
import { safeUrl } from "../assets/js/sanitize.js";

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
function paragrafar(texto) {
  return texto.split(/\n\s*\n/).map((p) => `<p>${escapeHtml(p.trim())}</p>`).join("");
}
// A orientação pode ter sido salva pelo pequeno editor de texto do painel
// (HTML com negrito/itálico/tamanho/alinhamento) ou, para tratamentos mais
// antigos, como texto simples. Em ambos os casos o visitante nunca deve ver
// tags soltas — apenas o resultado formatado.
function renderizarOrientacao(texto) {
  return pareceHtml(texto) ? sanitizeRichHtml(texto) : paragrafar(texto);
}

async function carregar() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  const container = document.querySelector("[data-tratamento]");
  if (!slug) { container.innerHTML = `<p class="texto-suave">Tratamento não encontrado. <a href="/tratamentos/">Voltar</a>.</p>`; return; }

  const { data, error } = await supabase.from("treatments").select("*").eq("slug", slug).eq("published", true).single();
  if (error || !data) { container.innerHTML = `<p class="texto-suave">Tratamento não encontrado. <a href="/tratamentos/">Voltar</a>.</p>`; return; }

  document.title = `${data.name} — Especialista em Pele`;
  const ctaUrl = data.cta_url ? safeUrl(data.cta_url) : "";
  const ctaHtml = data.cta_label && ctaUrl
    ? `<p class="texto-centro" style="margin-top:28px"><a class="btn btn-dourado" href="${ctaUrl}">${escapeHtml(data.cta_label)}</a></p>`
    : "";

  // ------------------------------------------------------------------
  // Meta tags por tratamento (descrição, Open Graph, Twitter Card e
  // canonical) — os placeholders genéricos do <head> são sobrescritos
  // aqui com os dados de cada tratamento publicado. Nada disso altera
  // o que aparece visualmente na página.
  // ------------------------------------------------------------------
  const tituloCompleto = `${data.name} — Especialista em Pele`;
  const resumoBruto = (data.summary || data.description || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const descricaoMeta = (resumoBruto.slice(0, 155) || "Tratamento regenerativo — Especialista em Pele.");
  // Mesma regra de slug usada em scripts/gerar-paginas-tratamentos.mjs —
  // aponta o canonical para a página estática pré-renderizada, para o
  // Google não tratar esta versão dinâmica como conteúdo duplicado.
  const slugArquivo = slug.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const urlCanonica = `https://www.especialistaempele.com.br/tratamentos/${slugArquivo}.html`;
  const imagemMeta = data.cover_image_url || "https://www.especialistaempele.com.br/assets/hero-fallback.webp";

  document.getElementById("meta-description")?.setAttribute("content", descricaoMeta);
  document.getElementById("og-title")?.setAttribute("content", tituloCompleto);
  document.getElementById("og-description")?.setAttribute("content", descricaoMeta);
  document.getElementById("og-url")?.setAttribute("content", urlCanonica);
  document.getElementById("og-image")?.setAttribute("content", imagemMeta);
  document.getElementById("twitter-title")?.setAttribute("content", tituloCompleto);
  document.getElementById("twitter-description")?.setAttribute("content", descricaoMeta);
  document.getElementById("link-canonical")?.setAttribute("href", urlCanonica);

  // Schema Service + BreadcrumbList (o breadcrumb visível já existe no
  // HTML — aqui só espelhamos a mesma trilha em dados estruturados).
  const schema = document.createElement("script");
  schema.type = "application/ld+json";
  schema.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "name": data.name,
        "description": descricaoMeta,
        "image": imagemMeta,
        "url": urlCanonica,
        "provider": { "@type": "Person", "name": "Danielle Brito" },
        "areaServed": ["Araruama", "Cabo Frio", "Copacabana", "Brasil"],
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Início", "item": "https://www.especialistaempele.com.br/" },
          { "@type": "ListItem", "position": 2, "name": "Tratamentos", "item": "https://www.especialistaempele.com.br/tratamentos/" },
          { "@type": "ListItem", "position": 3, "name": data.name, "item": urlCanonica },
        ],
      },
    ],
  });
  document.head.appendChild(schema);

  container.innerHTML = `
    <p class="card__meta texto-centro">Tratamento regenerativo</p>
    <h1 class="texto-centro">${escapeHtml(data.name)}</h1>
    ${data.cover_image_url ? `<img src="${data.cover_image_url}" alt="${escapeHtml(data.name)}" style="width:100%;border-radius:10px;margin:24px 0" loading="lazy">` : ""}
    <div class="artigo-corpo">${renderizarOrientacao(data.description || data.summary || "")}</div>
    ${ctaHtml}
  `;
  const bc = document.querySelector("[data-breadcrumb-atual]");
  if (bc) bc.textContent = data.name;
}
carregar();
