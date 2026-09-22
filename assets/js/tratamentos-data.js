import { supabase } from "./supabase-client.js";
import { escapeHtml, safeUrl } from "./sanitize.js";
// Mesma regra de slug usada em scripts/gerar-paginas-tratamentos.mjs e
// em scripts/gerar-sitemap.mjs — precisa ficar idêntica nos três lugares,
// senão os links quebram.
function slugifyUrl(valor){return String(valor??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");}
function cardTratamento(t){const image=safeUrl(t.cover_image_url);return `<article class="card"><div class="card__img">${image?`<img src="${escapeHtml(image)}" alt="${escapeHtml(t.name)}" style="width:100%;height:100%;object-fit:cover" loading="lazy">`:''}</div><div class="card__corpo"><span class="selo">Regenerativo</span><h3>${escapeHtml(t.name)}</h3><p>${escapeHtml(t.summary)}</p><a class="card__link" href="/tratamentos/${slugifyUrl(t.slug||'')}.html">Saiba mais →</a></div></article>`;}
async function carregar(){const container=document.querySelector("[data-grade-tratamentos]");if(!container)return;const{data,error}=await supabase.from("treatments").select("*").eq("published",true).order("sort_order",{ascending:true});if(error||!data?.length){container.innerHTML=`<p class="texto-suave">Nenhum tratamento publicado no momento.</p>`;return;}container.innerHTML=data.map(cardTratamento).join("");}carregar();
