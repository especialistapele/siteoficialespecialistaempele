import { supabase } from "./supabase-client.js";
import { escapeHtml, safeUrl } from "./sanitize.js";
import { initAntesDepoisSlider } from "./antes-depois-slider.js";

function cardResultado(r) {
  const before = safeUrl(r.before_image_url), after = safeUrl(r.after_image_url);
  const slider = (before && after)
    ? `<div class="antes-depois-slider" data-antes-depois>
         <img class="ad-depois" src="${escapeHtml(after)}" alt="Depois">
         <img class="ad-antes" src="${escapeHtml(before)}" alt="Antes">
         <span class="ad-tag ad-tag-antes">Antes</span>
         <span class="ad-tag ad-tag-depois">Depois</span>
         <div class="ad-handle"><span class="ad-handle-grip"></span></div>
       </div>`
    : "";
  return `<article class="card">${slider}<div class="card__corpo">${r.treatments ? `<span class="selo">${escapeHtml(r.treatments.name)}</span>` : ""}<p>${escapeHtml(r.description)}</p></div></article>`;
}

async function carregar() {
  const container = document.querySelector("[data-grade-resultados]");
  if (!container) return;
  const { data, error } = await supabase
    .from("results")
    .select("*, treatments(name)")
    .eq("published", true)
    .eq("consent_confirmed", true)
    .order("created_at", { ascending: false });
  if (error || !data?.length) {
    container.innerHTML = `<p class="texto-suave">Em breve, resultados documentados com consentimento das pacientes.</p>`;
    return;
  }
  container.innerHTML = data.map(cardResultado).join("");
  initAntesDepoisSlider(container);
}
carregar();
