// ============================================================
// whatsapp.js — gera o link wa.me com mensagem por página de origem
// ============================================================

(function () {
  const NUMERO_WHATSAPP = "5521992197518";

  const mensagensPorPagina = {
    home: "Olá! Vi o site da Especialista em Pele e gostaria de saber mais sobre os tratamentos.",
    tratamentos: "Olá! Estou vendo os tratamentos no site e gostaria de tirar uma dúvida.",
    acne: "Olá! Tenho interesse no tratamento regenerativo para acne.",
    melasma: "Olá! Tenho interesse no tratamento regenerativo para melasma.",
    rosacea: "Olá! Tenho interesse no tratamento regenerativo para rosácea.",
    remocoes: "Olá! Gostaria de saber mais sobre remoção de sinais, verrugas e nevos.",
    corporal: "Olá! Tenho interesse nos tratamentos corporais.",
    resultados: "Olá! Vi os resultados no site e gostaria de agendar uma avaliação.",
    blog: "Olá! Li um artigo no blog e gostaria de saber mais.",
    sobre: "Olá! Conheci a história da Especialista em Pele no site e gostaria de agendar uma consulta.",
    "pre-atendimento": "Olá! Acabei de preencher o formulário de pré-atendimento no site.",
    contato: "Olá! Gostaria de agendar uma consulta.",
    consultoria: "Olá! Conheci a Consultoria de Skincare Regenerativo Online e gostaria de conhecer os programas.",
    "local-araruama": "Olá! Vi a página de Araruama no site e gostaria de agendar uma consulta.",
    "local-cabofrio": "Olá! Vi a página de Cabo Frio/Riviera no site e gostaria de agendar uma consulta.",
    "local-copacabana": "Olá! Vi a página de Copacabana no site e gostaria de agendar uma consulta.",
    "local-acne-araruama": "Olá! Tenho interesse no acompanhamento para acne em Araruama.",
    "local-acne-cabo-frio-riviera": "Olá! Tenho interesse no acompanhamento para acne em Cabo Frio/Riviera.",
    "local-acne-copacabana": "Olá! Tenho interesse no acompanhamento para acne em Copacabana.",
    "local-melasma-araruama": "Olá! Tenho interesse no acompanhamento para melasma em Araruama.",
    "local-melasma-cabo-frio-riviera": "Olá! Tenho interesse no acompanhamento para melasma em Cabo Frio/Riviera.",
    "local-melasma-copacabana": "Olá! Tenho interesse no acompanhamento para melasma em Copacabana.",
    "local-rosacea-araruama": "Olá! Tenho interesse no acompanhamento para rosácea em Araruama.",
    "local-rosacea-cabo-frio-riviera": "Olá! Tenho interesse no acompanhamento para rosácea em Cabo Frio/Riviera.",
    "local-rosacea-copacabana": "Olá! Tenho interesse no acompanhamento para rosácea em Copacabana.",
  };

  const pagina = document.body.dataset.pagina || "home";
  const mensagem = mensagensPorPagina[pagina] || mensagensPorPagina.home;
  const link = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensagem)}`;

  document.querySelectorAll("[data-whatsapp-link]").forEach((el) => {
    el.setAttribute("href", link);
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener");
  });

  // O bot usa o link já resolvido por este arquivo, evitando duplicar
  // número/configuração de WhatsApp em outra parte do site.
  const botExclusions = [/^\/painel(?:\/|$)/, /^\/pre-atendimento(?:\/|$)/, /^\/privacidade\.html$/, /^\/cookies\.html$/];
  if (!botExclusions.some((rx) => rx.test(window.location.pathname))) {
    const loadBot = () => {
      if (!document.querySelector('link[data-ep-bot-css]')) {
        const css = document.createElement("link");
        css.rel = "stylesheet";
        css.href = "/assets/css/bot-triagem.css";
        css.dataset.epBotCss = "true";
        document.head.appendChild(css);
      }
      if (!document.querySelector('script[data-ep-bot-config]')) {
        const cfg = document.createElement("script");
        cfg.src = "/assets/js/bot-config.js";
        cfg.dataset.epBotConfig = "true";
        cfg.onload = () => {
          if (!document.querySelector('script[data-ep-bot-auto]')) {
            const auto = document.createElement("script");
            auto.src = "/assets/js/bot-tratamentos-auto.js";
            auto.dataset.epBotAuto = "true";
            auto.onload = () => {
              if (!document.querySelector('script[data-ep-bot-engine]')) {
                const engine = document.createElement("script");
                engine.src = "/assets/js/bot-triagem.js";
                engine.defer = true;
                engine.dataset.epBotEngine = "true";
                document.body.appendChild(engine);
              }
            };
            document.head.appendChild(auto);
          }
        };
        document.head.appendChild(cfg);
      }
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", loadBot, { once: true });
    } else {
      loadBot();
    }
  }
})();

// Rastreamento de cliques no WhatsApp (GA4), em páginas que carregam este módulo.

  // Mede cliques de saída para o WhatsApp sem enviar dados digitados pelo visitante.
  document.addEventListener('click', function(event) {
    var link = event.target && event.target.closest ? event.target.closest('a[href*="wa.me/"], a[href*="whatsapp.com/"], a[href*="api.whatsapp.com/"]') : null;
    if (!link || typeof window.gtag !== 'function') return;
    window.gtag('event', 'whatsapp_click', {
      link_url: link.href,
      link_text: (link.innerText || link.getAttribute('aria-label') || 'WhatsApp').trim().slice(0, 100),
      page_path: window.location.pathname,
      page_title: document.title
    });
  }, true);

// Google Analytics 4 — medição das páginas públicas que carregam este módulo.
(function(){
  if (window.__especialistaPeleGA4Loaded) return;
  window.__especialistaPeleGA4Loaded = true;
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=G-YPF8LKST26';
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function(){window.dataLayer.push(arguments);};
  window.gtag('js', new Date());
  window.gtag('config', 'G-YPF8LKST26');
})();
