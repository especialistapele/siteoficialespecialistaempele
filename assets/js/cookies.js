// ============================================================
// cookies.js — consentimento de cookies (LGPD) e liberação do GA4
// O Google Analytics só é carregado depois do aceite explícito.
// ============================================================

(function () {
  const CHAVE_LOCAL = "ep_cookie_consent";
  const GA_ID = "G-YPF8LKST26";

  function criarBannerSeNecessario() {
    let banner = document.querySelector("[data-cookie-banner]");
    if (banner) return banner;

    if (!document.querySelector("[data-cookie-banner-style]")) {
      const style = document.createElement("style");
      style.setAttribute("data-cookie-banner-style", "");
      style.textContent = ".cookie-banner{position:fixed;left:16px;right:16px;bottom:16px;max-width:560px;margin:0 auto;background:#fff;border:1px solid #ddd;border-radius:10px;box-shadow:0 10px 30px rgba(38,49,45,.18);padding:20px;z-index:9999;display:none;color:#26312d}.cookie-banner.visivel{display:block}.cookie-banner p{font-size:13.5px;line-height:1.5;color:#58645f;margin:0 0 14px}.cookie-banner a{color:inherit;text-decoration:underline}.cookie-banner__acoes{display:flex;gap:10px;flex-wrap:wrap}.cookie-banner button{min-height:40px;padding:9px 16px;border-radius:7px;border:1px solid #b99b65;cursor:pointer;font:inherit}.cookie-banner .btn-dourado{background:#c9a45b;color:#26312d}.cookie-banner .btn-fora{background:#fff;color:#26312d}@media(max-width:480px){.cookie-banner{left:10px;right:10px;bottom:10px;padding:16px}}";
      document.head.appendChild(style);
    }

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
      const { supabase } = await import("./supabase-client.js");
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
