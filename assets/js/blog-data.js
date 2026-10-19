import { supabase } from "./supabase-client.js";
import { escapeHtml, safeUrl } from "./sanitize.js";

// Mantém a mesma regra de slug usada pelo gerador de conteúdo e pelo sitemap.
function slugifyUrl(valor){return String(valor??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");}

function cardArtigo(a) {
  const data = a.published_at ? new Date(a.published_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : "";
  const image = safeUrl(a.cover_image_url);
  return `<article class="card"><div class="card__img">${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(a.title)}" style="width:100%;height:100%;object-fit:cover" loading="lazy">` : ""}</div><div class="card__corpo"><span class="card__meta">${escapeHtml(data)}</span><h3>${escapeHtml(a.title)}</h3><p>${escapeHtml(a.excerpt)}</p><a class="card__link" href="/blog/${slugifyUrl(a.slug||'')}.html">Ler artigo →</a></div></article>`;
}

function normalizar(valor) {
  return String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
}

function categoriaDoArtigo(artigo) {
  const texto = normalizar(artigo.textContent);
  const url = normalizar(artigo.querySelector("a.card__link")?.getAttribute("href"));
  if (/\b(acne|espinha|comedao|cravo|hormonal)\b/.test(texto + " " + url)) return "acne";
  if (/\b(melasma|mancha|hiperpigment|pigmentacao)\b/.test(texto + " " + url)) return "melasma";
  if (/\b rosacea\b|rosacea|sensibilidade|pele sensivel/.test(texto + " " + url)) return "rosacea";
  if (/\b(skincare|rotina|oleosidade|limpeza de pele|protetor solar|hidratacao)\b/.test(texto + " " + url)) return "skincare";
  if (/\b(regeneracao|rejuvenescimento|envelhecimento|colageno|firmeza)\b/.test(texto + " " + url)) return "regeneracao";
  if (/\b(ativo|ativos|ingrediente|bakuchiol|resveratrol|niacinamida|retino|barreira cutanea|ciencia)\b/.test(texto + " " + url)) return "ciencia";
  return "outros";
}

function iniciarFiltros(container) {
  const busca = document.querySelector("[data-blog-busca]");
  const categoria = document.querySelector("[data-blog-categoria]");
  const limpar = document.querySelector("[data-blog-limpar]");
  const contagem = document.querySelector("[data-blog-contagem]");
  if (!busca || !categoria || !limpar || !contagem) return;

  const filtrar = () => {
    const termo = normalizar(busca.value.trim());
    const assunto = categoria.value;
    const artigos = [...container.querySelectorAll("article.card")];
    let visiveis = 0;

    artigos.forEach((artigo) => {
      const texto = normalizar(artigo.textContent);
      const correspondeTexto = !termo || texto.includes(termo) || normalizar(artigo.querySelector("a.card__link")?.getAttribute("href")).includes(termo);
      const correspondeCategoria = assunto === "todos" || categoriaDoArtigo(artigo) === assunto;
      const mostrar = correspondeTexto && correspondeCategoria;
      artigo.hidden = !mostrar;
      if (mostrar) visiveis += 1;
    });

    contagem.textContent = visiveis === 1 ? "1 artigo encontrado" : `${visiveis} artigos encontrados`;
    let vazio = document.querySelector("[data-blog-vazio]");
    if (!vazio) {
      vazio = document.createElement("p");
      vazio.className = "blog-sem-resultados";
      vazio.dataset.blogVazio = "";
      vazio.setAttribute("role", "status");
      vazio.textContent = "Não encontramos artigos com esses filtros. Tente outras palavras ou limpe a busca.";
      container.insertAdjacentElement("afterend", vazio);
    }
    vazio.hidden = visiveis !== 0;
  };

  busca.addEventListener("input", filtrar);
  categoria.addEventListener("change", filtrar);
  limpar.addEventListener("click", () => {
    busca.value = "";
    categoria.value = "todos";
    filtrar();
    busca.focus();
  });
  filtrar();
}

async function carregar() {
  const container = document.querySelector("[data-grade-artigos]");
  if (!container) return;
  iniciarFiltros(container);

  const {data,error} = await supabase.from("articles").select("*").eq("published",true).order("published_at",{ascending:false});
  // Se o Supabase estiver indisponível, preserva os cards estáticos já publicados no HTML.
  if (error || !data?.length) {
    if (!container.querySelector("article.card")) {
      container.innerHTML = `<p class="texto-suave">Nenhum artigo publicado no momento.</p>`;
    }
    return;
  }
  container.innerHTML = data.map(cardArtigo).join("");
  container.dispatchEvent(new Event("blog:artigos-atualizados"));
  // Reaplica busca e categoria depois que os artigos do CMS substituem os cards estáticos.
  const busca = document.querySelector("[data-blog-busca]");
  const categoria = document.querySelector("[data-blog-categoria]");
  if (busca) busca.dispatchEvent(new Event("input"));
  if (categoria) categoria.dispatchEvent(new Event("change"));
}

carregar();
