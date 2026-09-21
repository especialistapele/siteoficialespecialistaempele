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
  };

  const pagina = document.body.dataset.pagina || "home";
  const mensagem = mensagensPorPagina[pagina] || mensagensPorPagina.home;
  const link = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensagem)}`;

  document.querySelectorAll("[data-whatsapp-link]").forEach((el) => {
    el.setAttribute("href", link);
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener");
  });
})();
