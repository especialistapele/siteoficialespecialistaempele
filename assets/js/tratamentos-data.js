import { supabase } from "./supabase-client.js";
import { escapeHtml, safeUrl } from "./sanitize.js";

// A regra precisa corresponder ao gerador de páginas estáticas e ao sitemap.
function slugifyUrl(valor) {
  return String(valor ?? "").normalize("NFD").replace(/[\\u0300-\\u036f]/g, "")
    .toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function posicao(valor, padrao = 50) {
  const n = Number(valor);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : padrao;
}
function cardTratamento(t) {
  const image = safeUrl(t.cover_image_url) || "/assets/tratamentos.webp";
  const alt = t.cover_image_url ? t.name : "Tratamentos de pele — Especialista em Pele";
  const x = posicao(t.cover_position_x);
  const y = posicao(t.cover_position_y);
  const resumo = String(t.summary || t.description || "").replace(/<[^>]*>/g, " ").replace(/\\s+/g, " ").trim();
  return `<article class="card">
    <div class="card__img">
      <img src="${escapeHtml(image)}" alt="${escapeHtml(alt)}" width="800" height="600"
        style="object-position:${x}% ${y}%" loading="lazy" decoding="async">
    </div>
    <div class="card__corpo">
      <span class="selo">Regenerativo</span>
      <h3>${escapeHtml(t.name)}</h3>
      <p>${escapeHtml(resumo)}</p>
      <a class="card__link" href="/tratamentos/${slugifyUrl(t.slug || "")}.html" aria-label="Conhecer ${escapeHtml(t.name)}">Conhecer tratamento <span aria-hidden="true">→</span></a>
    </div>
  </article>`;
}
async function carregar() {
  const container = document.querySelector("[data-grade-tratamentos]");
  if (!container) return;
  const { data, error } = await supabase.from("treatments").select("*").eq("published", true).order("sort_order", { ascending: true });
  // O HTML original permanece visível e rastreável se a API estiver indisponível.
  if (error || !data?.length) return;
  container.innerHTML = data.map(cardTratamento).join("");
}
carregar();
