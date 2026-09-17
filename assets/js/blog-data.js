import { supabase } from "./supabase-client.js";
import { escapeHtml, safeUrl } from "./sanitize.js";

function cardArtigo(a) {
  const data = a.published_at ? new Date(a.published_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : "";
  const image = safeUrl(a.cover_image_url);
  return `<article class="card"><div class="card__img">${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(a.title)}" style="width:100%;height:100%;object-fit:cover" loading="lazy">` : ""}</div><div class="card__corpo"><span class="card__meta">${escapeHtml(data)}</span><h3>${escapeHtml(a.title)}</h3><p>${escapeHtml(a.excerpt)}</p><a class="card__link" href="/blog/artigos/?slug=${encodeURIComponent(a.slug || '')}">Ler artigo →</a></div></article>`;
}
async function carregar() { const container=document.querySelector("[data-grade-artigos]"); if(!container)return; const {data,error}=await supabase.from("articles").select("*").eq("published",true).order("published_at",{ascending:false}); if(error||!data?.length){container.innerHTML=`<p class="texto-suave">Nenhum artigo publicado no momento.</p>`;return;} container.innerHTML=data.map(cardArtigo).join(""); }
carregar();
