// ============================================================
// cookies.js — banner de consentimento (LGPD)
// Registra o consentimento no Supabase (tabela cookie_consents)
// e só então libera scripts de analytics.
// ============================================================

import { supabase } from "./supabase-client.js";

(function () {
  const CHAVE_LOCAL = "ep_cookie_consent";
  const banner = document.querySelector("[data-cookie-banner]");
  if (!banner) return;

  const consentimentoSalvo = localStorage.getItem(CHAVE_LOCAL);

  const carregarAnalytics = () => {
    // Espaço reservado: inserir aqui o snippet do Google Tag Manager
    // quando a conta estiver configurada. Só executa após consentimento.
    console.log("Analytics liberado após consentimento do usuário.");
  };

  const registrarConsentimento = async (analytics) => {
    try {
      await supabase.from("cookie_consents").insert({
        consent_analytics: analytics,
        consent_marketing: analytics,
        user_agent: navigator.userAgent,
      });
    } catch (erro) {
      console.warn("Não foi possível registrar o consentimento:", erro);
    }
  };

  if (!consentimentoSalvo) {
    banner.classList.add("visivel");
  } else if (consentimentoSalvo === "aceito") {
    carregarAnalytics();
  }

  banner.querySelector("[data-cookie-aceitar]")?.addEventListener("click", () => {
    localStorage.setItem(CHAVE_LOCAL, "aceito");
    banner.classList.remove("visivel");
    carregarAnalytics();
    registrarConsentimento(true);
  });

  banner.querySelector("[data-cookie-recusar]")?.addEventListener("click", () => {
    localStorage.setItem(CHAVE_LOCAL, "recusado");
    banner.classList.remove("visivel");
    registrarConsentimento(false);
  });
})();
