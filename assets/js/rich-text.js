// Sanitizador de HTML simples e restritivo para o conteúdo de orientação
// dos tratamentos. É usado tanto no editor do painel (antes de salvar)
// quanto na página pública do tratamento (antes de exibir), para garantir
// que apenas a formatação permitida pelo pequeno editor (negrito, itálico,
// tamanho de fonte e alinhamento) sobreviva — nunca HTML/JS arbitrário.

const ALLOWED_TAGS = new Set(["B", "STRONG", "I", "EM", "U", "SPAN", "P", "BR", "DIV", "H2", "H3", "UL", "OL", "LI"]);
const ALLOWED_STYLE_PROPS = new Set(["font-size", "text-align", "font-weight", "font-style"]);

function limparEstilo(el) {
  const permitido = {};
  for (const prop of ALLOWED_STYLE_PROPS) {
    const valor = el.style.getPropertyValue(prop);
    if (valor) permitido[prop] = valor;
  }
  el.removeAttribute("style");
  for (const [prop, valor] of Object.entries(permitido)) {
    el.style.setProperty(prop, valor);
  }
}

function limparNo(pai) {
  [...pai.childNodes].forEach((filho) => {
    if (filho.nodeType === 1) {
      if (!ALLOWED_TAGS.has(filho.tagName)) {
        while (filho.firstChild) pai.insertBefore(filho.firstChild, filho);
        pai.removeChild(filho);
        return;
      }
      [...filho.attributes].forEach((attr) => {
        if (attr.name !== "style") filho.removeAttribute(attr.name);
      });
      limparEstilo(filho);
      limparNo(filho);
    } else if (filho.nodeType !== 3) {
      pai.removeChild(filho);
    }
  });
}

export function sanitizeRichHtml(html) {
  const template = document.createElement("template");
  template.innerHTML = String(html ?? "");
  limparNo(template.content);
  return template.innerHTML.trim();
}

// Converte HTML antigo em texto puro (usado para popular o editor quando o
// valor salvo ainda é texto simples, de antes do editor existir).
export function pareceHtml(valor) {
  return /<\/?[a-z][\s\S]*>/i.test(String(valor ?? ""));
}
