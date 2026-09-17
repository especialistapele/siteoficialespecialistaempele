// ============================================================
// ANTES / DEPOIS — slider de comparação com arraste
// Usado na página de Resultados do site e no Painel Admin.
//
// Estrutura esperada em cada elemento [data-antes-depois]:
//   <div class="antes-depois-slider" data-antes-depois>
//     <img class="ad-depois" src="..." alt="Depois">
//     <img class="ad-antes" src="..." alt="Antes">
//     <span class="ad-tag ad-tag-antes">Antes</span>
//     <span class="ad-tag ad-tag-depois">Depois</span>
//     <div class="ad-handle"><span class="ad-handle-grip"></span></div>
//   </div>
//
// Arrastar para a direita revela mais da foto "Antes" (a imagem
// de cima). Arrastar para a esquerda revela o "Depois" (a imagem
// de baixo, que fica sempre 100% visível por baixo do recorte).
// ============================================================

export function initAntesDepoisSlider(root = document) {
  const elementos =
    root instanceof Element && root.matches("[data-antes-depois]")
      ? [root]
      : Array.from(root.querySelectorAll("[data-antes-depois]"));

  elementos.forEach((el) => {
    if (el.dataset.adReady) return;
    el.dataset.adReady = "1";

    const antes = el.querySelector(".ad-antes");
    const depois = el.querySelector(".ad-depois");
    const handle = el.querySelector(".ad-handle");
    if (!antes || !handle) return;

    // Na variante "proporcional" (usada no acompanhamento fotográfico do
    // Prontuário), a área de comparação assume a proporção real da foto
    // em vez de um quadrado fixo, para não cortar as imagens.
    if (el.classList.contains("antes-depois-slider--proporcional") && depois) {
      const ajustarProporcao = () => {
        if (depois.naturalWidth && depois.naturalHeight) {
          el.style.aspectRatio = `${depois.naturalWidth} / ${depois.naturalHeight}`;
        }
      };
      if (depois.complete && depois.naturalWidth) ajustarProporcao();
      else depois.addEventListener("load", ajustarProporcao, { once: true });
    }

    function definirPosicao(percentual) {
      const pct = Math.max(0, Math.min(100, percentual));
      antes.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
      handle.style.left = pct + "%";
    }

    function posicaoDoEvento(clientX) {
      const rect = el.getBoundingClientRect();
      if (!rect.width) return;
      definirPosicao(((clientX - rect.left) / rect.width) * 100);
    }

    let arrastando = false;

    el.addEventListener("pointerdown", (e) => {
      arrastando = true;
      try { el.setPointerCapture(e.pointerId); } catch (_) {}
      posicaoDoEvento(e.clientX);
    });
    el.addEventListener("pointermove", (e) => {
      if (arrastando) posicaoDoEvento(e.clientX);
    });
    el.addEventListener("pointerup", () => { arrastando = false; });
    el.addEventListener("pointercancel", () => { arrastando = false; });
    el.addEventListener("keydown", (e) => {
      const atual = parseFloat(handle.style.left) || 50;
      if (e.key === "ArrowRight") definirPosicao(atual + 5);
      if (e.key === "ArrowLeft") definirPosicao(atual - 5);
    });

    definirPosicao(50);
  });
}

document.addEventListener("DOMContentLoaded", () => initAntesDepoisSlider(document));
