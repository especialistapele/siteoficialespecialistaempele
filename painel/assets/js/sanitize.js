// Sanitização compartilhada do painel. Nunca usar conteúdo do banco diretamente em HTML.
export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}
export function safeUrl(value) {
  try {
    const url = new URL(String(value ?? ""), window.location.origin);
    return ["http:", "https:"].includes(url.protocol) ? escapeHtml(url.href) : "";
  } catch { return ""; }
}
