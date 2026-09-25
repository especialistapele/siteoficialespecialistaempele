// Painel visual do estado real da publicação no site.
import { supabase } from "./painel-auth.js";

const MANIFEST_URL = "/publicacao-manifest.json";
const INTERVALO_MS = 8000;

const STATUS = {
  requested: ["Solicitada", "aguardando"],
  dispatched: ["Enviada ao GitHub", "aguardando"],
  confirmed: ["Publicada no site", "ok"],
  timeout: ["Aguardando confirmação", "aviso"],
  error: ["Erro na publicação", "erro"],
};

function escapeHtml(v) {
  return String(v ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}
function normalizarPath(v) { return String(v || "").replace(/^\/+/, ""); }
function dataBR(v) {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("pt-BR", { dateStyle:"short", timeStyle:"short" });
}
async function lerManifesto() {
  try {
    const r = await fetch(`${MANIFEST_URL}?t=${Date.now()}`, { cache:"no-store" });
    return r.ok ? await r.json() : null;
  } catch (_) { return null; }
}
function css() {
  if (document.getElementById("status-publicacao-css")) return;
  const style = document.createElement("style");
  style.id = "status-publicacao-css";
  style.textContent = `
    .status-publicacao{margin:0 0 18px;padding:16px 18px;border:1px solid var(--linha,#ddd7c9);border-radius:10px;background:#fff}
    .status-publicacao__top{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
    .status-publicacao__titulo{font-weight:700;font-size:15px;color:var(--texto,#26312d)}
    .status-publicacao__badge{display:inline-flex;align-items:center;gap:6px;padding:5px 9px;border-radius:999px;font-size:11px;font-weight:700}
    .status-publicacao__badge.ok{background:#e8f5ec;color:#24613a}.status-publicacao__badge.aguardando{background:#fff5dc;color:#7a5a14}.status-publicacao__badge.aviso{background:#fff0d9;color:#8a5a00}.status-publicacao__badge.erro{background:#fde9e9;color:#8b2424}
    .status-publicacao__grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:12px}
    .status-publicacao__item{font-size:11px;color:#777;padding-top:9px;border-top:1px solid var(--linha,#eee)}
    .status-publicacao__item strong{display:block;color:#303733;font-size:12px;margin-top:3px;word-break:break-word}
    .status-publicacao__vazio{font-size:12px;color:#777;margin:8px 0 0}
    @media(max-width:760px){.status-publicacao__grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
  `;
  document.head.appendChild(style);
}
export async function montarStatusPublicacao({ flash = null } = {}) {
  css();
  const alvo = flash?.parentElement || document.querySelector(".painel-main");
  if (!alvo || document.getElementById("status-publicacao")) return;
  const box = document.createElement("section");
  box.id = "status-publicacao";
  box.className = "status-publicacao";
  box.innerHTML = '<div class="status-publicacao__top"><div class="status-publicacao__titulo">Status da publicação do site</div><span class="status-publicacao__badge aguardando">Consultando…</span></div><p class="status-publicacao__vazio">Verificando a última publicação e o estado atual da página.</p>';
  if (flash) flash.insertAdjacentElement("afterend", box); else alvo.prepend(box);

  async function atualizar() {
    const badge = box.querySelector(".status-publicacao__badge");
    const vazio = box.querySelector(".status-publicacao__vazio");
    const { data, error } = await supabase.from("publication_requests")
      .select("request_id,path,content_id,publicado,status,requested_at,dispatched_at,confirmed_at,updated_at,error_message")
      .order("requested_at", { ascending:false }).limit(1).maybeSingle();
    if (error) {
      badge.className = "status-publicacao__badge erro"; badge.textContent = "Não foi possível consultar";
      vazio.textContent = "O histórico de publicação ainda não pôde ser carregado.";
      return;
    }
    if (!data) {
      badge.className = "status-publicacao__badge aguardando"; badge.textContent = "Sem solicitações";
      vazio.textContent = "Ainda não há uma publicação registrada pelo painel.";
      return;
    }
    const [label, classe] = STATUS[data.status] || [data.status || "Desconhecido", "aviso"];
    const manifesto = await lerManifesto();
    const path = normalizarPath(data.path);
    const item = (manifesto?.items || []).find(x => normalizarPath(x.path) === path);
    const estadoSite = item ? (item.status === "published" ? "Publicado" : item.status === "redirect" ? "Redirecionamento" : item.status) : (data.publicado === false ? "Fora do site" : "Não encontrado no manifesto");
    const http = item?.http_status ?? (data.publicado === false ? 404 : "—");
    badge.className = `status-publicacao__badge ${classe}`; badge.textContent = label;
    vazio.innerHTML = data.error_message
      ? `Erro: ${escapeHtml(data.error_message)}`
      : "O painel está acompanhando o estado registrado pelo sistema de publicação.";
    box.querySelector(".status-publicacao__grid")?.remove();
    const grid = document.createElement("div");
    grid.className = "status-publicacao__grid";
    grid.innerHTML = [
      ["Página", path ? "/" + escapeHtml(path) : "—"],
      ["Estado no site", escapeHtml(estadoSite)],
      ["HTTP", escapeHtml(http)],
      ["Última atualização", escapeHtml(dataBR(data.confirmed_at || data.updated_at || data.requested_at))],
      ["Solicitação", escapeHtml(String(data.request_id || "").slice(0,8) || "—")],
      ["Conteúdo", escapeHtml(data.content_id || "—")],
      ["Ação", data.publicado ? "Publicar" : "Despublicar"],
      ["Manifesto", manifesto?.generated_at ? escapeHtml(dataBR(manifesto.generated_at)) : "—"],
    ].map(([k,v]) => `<div class="status-publicacao__item">${k}<strong>${v}</strong></div>`).join("");
    box.appendChild(grid);
  }
  await atualizar();
  const timer = setInterval(atualizar, INTERVALO_MS);
  window.addEventListener("beforeunload", () => clearInterval(timer), { once:true });
  window.addEventListener("publicacao:atualizada", atualizar);
}
