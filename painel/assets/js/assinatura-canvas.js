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

  // Prepara a resolução real do canvas a partir do tamanho exibido em tela.
  // Precisa ser chamada de novo sempre que o canvas ficar visível (ex.: ao
  // abrir um modal que estava com display:none — nesse momento clientWidth/
  // clientHeight seriam 0 e o desenho sairia em branco).
  function ajustarResolucao() {
    const largura = canvas.clientWidth;
    const altura = canvas.clientHeight;
    if (!largura || !altura) return; // ainda escondido: não mexe, tenta depois
    const proporcao = window.devicePixelRatio || 1;
    canvas.width = largura * proporcao;
    canvas.height = altura * proporcao;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
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
    // Chame isso sempre que o modal/aba com o canvas for exibido, antes de
    // deixar a pessoa desenhar — garante que o canvas tem o tamanho certo.
    redimensionar: ajustarResolucao,
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
