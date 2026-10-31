// ============================================================
// cookies.js — consentimento de cookies (LGPD) e liberação do GA4
// O Google Analytics só é carregado depois do aceite explícito.
// ============================================================

import { supabase } from "./supabase-client.js";

(function () {
  const CHAVE_LOCAL = "ep_cookie_consent";
  const GA_ID = "G-YPF8LKST26";

  function criarBannerSeNecessario() {
    let banner = document.querySelector("[data-cookie-banner]");
    if (banner) return banner;

    banner = document.createElement("div");
    banner.className = "cookie-banner";
    banner.setAttribute("data-cookie-banner", "");
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-label", "Preferências de cookies");

    const texto = document.createElement("p");
    texto.append("Usamos cookies para melhorar sua experiência. ");
    const link = document.createElement("a");
    link.href = "/cookies.html";
    link.textContent = "Saiba mais";
    texto.append(link, ".");

    const acoes = document.createElement("div");
    acoes.className = "cookie-banner__acoes";

    const aceitar = document.createElement("button");
    aceitar.type = "button";
    aceitar.className = "btn btn-dourado";
    aceitar.setAttribute("data-cookie-aceitar", "");
    aceitar.textContent = "Aceitar";

    const recusar = document.createElement("button");
    recusar.type = "button";
    recusar.className = "btn btn-fora";
    recusar.setAttribute("data-cookie-recusar", "");
    recusar.textContent = "Recusar";

    acoes.append(aceitar, recusar);
    banner.append(texto, acoes);
    document.body.appendChild(banner);
    return banner;
  }

  const banner = criarBannerSeNecessario();

  function carregarAnalytics() {
    if (window.__especialistaPeleGA4Loaded) return;

    window.__especialistaPeleGA4Loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () {
      window.dataLayer.push(arguments);
    };

    window.gtag("js", new Date());
    window.gtag("config", GA_ID, { anonymize_ip: true });

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    script.onerror = function () {
      window.__especialistaPeleGA4Loaded = false;
      console.warn("Não foi possível carregar o Google Analytics.");
    };
    document.head.appendChild(script);
  }

  async function registrarConsentimento(analytics) {
    try {
      await supabase.from("cookie_consents").insert({
        consent_analytics: analytics,
        consent_marketing: false,
      });
    } catch (erro) {
      console.warn("Não foi possível registrar o consentimento:", erro);
    }
  }

  const consentimentoSalvo = localStorage.getItem(CHAVE_LOCAL);

  if (!consentimentoSalvo) {
    banner.classList.add("visivel");
  } else {
    banner.classList.remove("visivel");
    if (consentimentoSalvo === "aceito") carregarAnalytics();
  }

  banner.querySelector("[data-cookie-aceitar]")?.addEventListener("click", function () {
    localStorage.setItem(CHAVE_LOCAL, "aceito");
    banner.classList.remove("visivel");
    carregarAnalytics();
    registrarConsentimento(true);
  });

  banner.querySelector("[data-cookie-recusar]")?.addEventListener("click", function () {
    localStorage.setItem(CHAVE_LOCAL, "recusado");
    banner.classList.remove("visivel");
    registrarConsentimento(false);
  });
})();
