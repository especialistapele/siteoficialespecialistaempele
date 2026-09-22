// ============================================================
// CARROSSEL DE RESULTADOS — antes/depois por tratamento
// Busca na tabela "results" (Supabase) os registros publicados e
// com consentimento confirmado de um tratamento específico, e
// monta um carrossel horizontal reaproveitando o componente
// .antes-depois-slider (mesmo usado em /resultados/).
//
// Uso:
//   <div class="rc-wrap" data-carrossel-resultados="TREATMENT_ID"></div>
//   <script type="module">
//     import { montarCarrosselResultados } from "/assets/js/carrossel-resultados.js";
//     montarCarrosselResultados();
//   </script>
// ============================================================

import { supabase } from "./supabase-client.js";
import { escapeHtml, safeUrl } from "./sanitize.js";
import { initAntesDepoisSlider } from "./antes-depois-slider.js";

const LIMITE = 12;

function cartaoResultado(r) {
  const before = safeUrl(r.before_image_url);
  const after = safeUrl(r.after_image_url);
  if (!before || !after) return "";
  return `
    <article class="rc-card">
      <div class="antes-depois-slider" data-antes-depois>
        <img class="ad-depois" src="${escapeHtml(after)}" alt="Depois" loading="lazy">
        <img class="ad-antes" src="${escapeHtml(before)}" alt="Antes" loading="lazy">
        <span class="ad-tag ad-tag-antes">Antes</span>
        <span class="ad-tag ad-tag-depois">Depois</span>
        <div class="ad-handle"><span class="ad-handle-grip"></span></div>
      </div>
      ${r.description ? `<div class="rc-card__corpo"><p>${escapeHtml(r.description)}</p></div>` : ""}
    </article>`;
}

export async function montarCarrosselResultados(root = document) {
  const wraps = Array.from(root.querySelectorAll("[data-carrossel-resultados]"));
  if (!wraps.length) return;

  await Promise.all(wraps.map(async (wrap) => {
    const treatmentId = wrap.dataset.carrosselResultados;
    if (!treatmentId) return;

    wrap.innerHTML = `<p class="rc-carregando">Carregando resultados…</p>`;

    const { data, error } = await supabase
      .from("results")
      .select("before_image_url, after_image_url, description, created_at")
      .eq("treatment_id", treatmentId)
      .eq("published", true)
      .eq("consent_confirmed", true)
      .order("created_at", { ascending: false })
      .limit(LIMITE);

    if (error || !data || !data.length) {
      wrap.innerHTML = `<p class="rc-vazio">Em breve, resultados documentados com consentimento das pacientes para este tratamento. <a href="/resultados/">Ver todos os resultados</a>.</p>`;
      return;
    }

    const cartoes = data.map(cartaoResultado).filter(Boolean).join("");
    if (!cartoes) {
      wrap.innerHTML = `<p class="rc-vazio">Em breve, resultados documentados com consentimento das pacientes para este tratamento. <a href="/resultados/">Ver todos os resultados</a>.</p>`;
      return;
    }

    wrap.innerHTML = `
      <div class="rc-track" data-rc-track>${cartoes}</div>
      <div class="rc-nav">
        <button type="button" data-rc-prev aria-label="Ver resultados anteriores">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M15 5l-7 7 7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <button type="button" data-rc-next aria-label="Ver próximos resultados">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
      <p class="rc-legenda">Arraste a alça em cada foto para comparar antes e depois. Resultados documentados com consentimento das pacientes — cada pele responde de um jeito.</p>`;

    const track = wrap.querySelector("[data-rc-track]");
    initAntesDepoisSlider(wrap);

    const passo = () => Math.min(320, track.clientWidth * 0.9);
    wrap.querySelector("[data-rc-prev]")?.addEventListener("click", () => {
      track.scrollBy({ left: -passo(), behavior: "smooth" });
    });
    wrap.querySelector("[data-rc-next]")?.addEventListener("click", () => {
      track.scrollBy({ left: passo(), behavior: "smooth" });
    });
  }));
}

document.addEventListener("DOMContentLoaded", () => montarCarrosselResultados(document));
