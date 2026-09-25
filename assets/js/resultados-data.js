import { supabase } from "./supabase-client.js";
import { escapeHtml, safeUrl } from "./sanitize.js";
import { initAntesDepoisSlider } from "./antes-depois-slider.js";

const TAMANHO_PAGINA = 20;

function cardResultado(r) {
  const before = safeUrl(r.before_image_url), after = safeUrl(r.after_image_url);
  const slider = (before && after)
    ? `<div class="antes-depois-slider" data-antes-depois>
         <img class="ad-depois" src="${escapeHtml(after)}" alt="Depois — ${escapeHtml(r.title || '')}">
         <img class="ad-antes" src="${escapeHtml(before)}" alt="Antes — ${escapeHtml(r.title || '')}">
         <span class="ad-tag ad-tag-antes">Antes</span>
         <span class="ad-tag ad-tag-depois">Depois</span>
         <div class="ad-handle"><span class="ad-handle-grip"></span></div>
       </div>`
    : "";
  return `<article class="card">${slider}<div class="card__corpo">${r.treatments ? `<span class="selo">${escapeHtml(r.treatments.name)}</span>` : ""}${r.title ? `<h3>${escapeHtml(r.title)}</h3>` : ""}<p>${escapeHtml(r.description)}</p>${r.slug ? `<a class="card__link" href="/resultados/${encodeURIComponent(r.slug)}.html">Ver caso completo →</a>` : ""}</div></article>`;
}

(function iniciar() {
  const container = document.querySelector("[data-grade-resultados]");
  if (!container) return;

  const filtroWrap = document.querySelector("[data-filtro-resultados]");
  const verMaisWrap = document.querySelector("[data-ver-mais-wrap]");
  const botaoVerMais = document.querySelector("[data-ver-mais]");

  let tratamentoAtual = "";
  let pagina = 0;
  let carregando = false;
  let semMaisResultados = false;

  // --------------------------------------------------------
  // Filtro por tratamento: usa exatamente os tratamentos já
  // cadastrados pelo admin (tabela "treatments"), sem lista
  // duplicada no frontend.
  // --------------------------------------------------------
  async function montarFiltro() {
    if (!filtroWrap) return;
    const { data: tratamentos } = await supabase
      .from("treatments")
      .select("id, name")
      .eq("published", true)
      .order("sort_order");

    const botoes = [{ id: "", name: "Todos os resultados" }, ...(tratamentos || [])];
    filtroWrap.innerHTML = botoes.map((t) => `
      <button type="button" class="btn ${t.id === "" ? "btn-dourado" : "btn-fora"}" data-filtro-id="${t.id}" style="padding:9px 18px;font-size:12.5px">
        ${escapeHtml(t.name)}
      </button>`).join("");

    filtroWrap.querySelectorAll("[data-filtro-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.dataset.filtroId === tratamentoAtual) return;
        tratamentoAtual = btn.dataset.filtroId;
        filtroWrap.querySelectorAll("[data-filtro-id]").forEach((b) => {
          const ativo = b.dataset.filtroId === tratamentoAtual;
          b.classList.toggle("btn-dourado", ativo);
          b.classList.toggle("btn-fora", !ativo);
        });
        reiniciarEcarregar();
      });
    });
  }

  function reiniciarEcarregar() {
    pagina = 0;
    semMaisResultados = false;
    container.innerHTML = `<p class="texto-suave">Carregando resultados…</p>`;
    if (verMaisWrap) verMaisWrap.style.display = "none";
    carregarPagina();
  }

  async function carregarPagina() {
    if (carregando || semMaisResultados) return;
    carregando = true;
    if (botaoVerMais) { botaoVerMais.disabled = true; botaoVerMais.textContent = "Carregando…"; }

    const inicio = pagina * TAMANHO_PAGINA;
    const fim = inicio + TAMANHO_PAGINA - 1;

    let consulta = supabase
      .from("results")
      .select("*, treatments(name)")
      .eq("published", true)
      .eq("consent_confirmed", true)
      .order("created_at", { ascending: false })
      .range(inicio, fim);

    if (tratamentoAtual) consulta = consulta.eq("treatment_id", tratamentoAtual);

    const { data, error } = await consulta;

    if (pagina === 0) container.innerHTML = "";

    if (error) {
      if (pagina === 0) container.innerHTML = `<p class="texto-suave">Não foi possível carregar os resultados agora.</p>`;
      carregando = false;
      return;
    }

    if (!data?.length && pagina === 0) {
      container.innerHTML = `<p class="texto-suave">Em breve, resultados documentados com consentimento das pacientes.</p>`;
    } else if (data?.length) {
      container.insertAdjacentHTML("beforeend", data.map(cardResultado).join(""));
      initAntesDepoisSlider(container);
    }

    if (!data || data.length < TAMANHO_PAGINA) {
      semMaisResultados = true;
      if (verMaisWrap) verMaisWrap.style.display = "none";
    } else {
      pagina += 1;
      if (verMaisWrap) verMaisWrap.style.display = "block";
    }

    if (botaoVerMais) { botaoVerMais.disabled = false; botaoVerMais.textContent = "Ver mais resultados"; }
    carregando = false;
  }

  botaoVerMais?.addEventListener("click", () => carregarPagina());

  montarFiltro();
  carregarPagina();
})();
