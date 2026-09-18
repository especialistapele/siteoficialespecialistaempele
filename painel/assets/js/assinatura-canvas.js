// ============================================================
// assinatura-canvas.js — captura de assinatura manuscrita
// (desenhada com o dedo ou com o mouse) num <canvas>.
// ============================================================

// Prepara o canvas para o tamanho real de exibição (nítido em
// telas de alta densidade) e devolve funções para controlar o
// desenho: saber se está vazio, limpar e exportar como arquivo.
export function criarAssinatura(canvas) {
  const ctx = canvas.getContext("2d");
  let desenhando = false;
  let temTraco = false;
  let ultimoX = 0;
  let ultimoY = 0;

  function ajustarResolucao() {
    const proporcao = window.devicePixelRatio || 1;
    const largura = canvas.clientWidth;
    const altura = canvas.clientHeight;
    canvas.width = largura * proporcao;
    canvas.height = altura * proporcao;
    ctx.scale(proporcao, proporcao);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1c2521";
  }
  ajustarResolucao();
  window.addEventListener("resize", ajustarResolucao);

  function posicaoRelativa(evento) {
    const retangulo = canvas.getBoundingClientRect();
    const ponto = evento.touches ? evento.touches[0] : evento;
    return { x: ponto.clientX - retangulo.left, y: ponto.clientY - retangulo.top };
  }

  function iniciar(evento) {
    evento.preventDefault();
    desenhando = true;
    const { x, y } = posicaoRelativa(evento);
    ultimoX = x;
    ultimoY = y;
  }

  function mover(evento) {
    if (!desenhando) return;
    evento.preventDefault();
    const { x, y } = posicaoRelativa(evento);
    ctx.beginPath();
    ctx.moveTo(ultimoX, ultimoY);
    ctx.lineTo(x, y);
    ctx.stroke();
    ultimoX = x;
    ultimoY = y;
    temTraco = true;
  }

  function parar() {
    desenhando = false;
  }

  canvas.addEventListener("mousedown", iniciar);
  canvas.addEventListener("mousemove", mover);
  window.addEventListener("mouseup", parar);
  canvas.addEventListener("touchstart", iniciar, { passive: false });
  canvas.addEventListener("touchmove", mover, { passive: false });
  canvas.addEventListener("touchend", parar);

  return {
    estaVazia: () => !temTraco,
    limpar() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      temTraco = false;
    },
    // Devolve a assinatura como Blob PNG, pronta para subir ao Storage.
    paraBlob() {
      return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    },
    // Devolve a assinatura como data URL, útil para colocar direto num PDF.
    paraDataUrl() {
      return canvas.toDataURL("image/png");
    },
  };
}
