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

function statusBR(status) { return STATUS[status]?.[0] || status || "Desconhecido"; }
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
    .historico-publicacao{margin-top:18px;padding-top:16px;border-top:1px solid var(--linha,#eee)}
    .historico-publicacao__titulo{font-weight:700;font-size:14px;color:var(--texto,#26312d);margin-bottom:8px}
    .historico-publicacao__subtitulo,.historico-publicacao__empty{font-size:11px;color:#777;margin:0 0 10px}
    .historico-publicacao__table-wrap{overflow-x:auto}
    .historico-publicacao__table{width:100%;border-collapse:collapse;font-size:11px;min-width:720px}
    .historico-publicacao__table th{text-align:left;color:#777;font-weight:600;padding:8px;border-bottom:1px solid var(--linha,#ddd7c9)}
    .historico-publicacao__table td{padding:9px 8px;border-bottom:1px solid var(--linha,#eee);vertical-align:top}
    .historico-publicacao__path{font-weight:600;max-width:260px;word-break:break-word}
    .historico-publicacao__id{font-family:monospace;font-size:10px;white-space:nowrap}
    .historico-publicacao__erro{display:block;color:#8b2424;margin-top:3px;max-width:260px;word-break:break-word}
    .historico-publicacao__status{white-space:nowrap}

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
  async function atualizarHistorico(box) {
    let secao = box.querySelector(".historico-publicacao");
    if (!secao) {
      secao = document.createElement("section");
      secao.className = "historico-publicacao";
      box.appendChild(secao);
    }
    const { data, error } = await supabase.from("publication_requests")
      .select("request_id,path,content_id,publicado,status,requested_at,error_message")
      .order("requested_at", { ascending: false }).limit(20);
    secao.innerHTML = '<div class="historico-publicacao__titulo">Histórico recente</div>';
    if (error || !data?.length) {
      secao.insertAdjacentHTML("beforeend", '<div class="historico-publicacao__empty">' + (error ? "Não foi possível carregar o histórico." : "Ainda não há solicitações registradas.") + '</div>');
      return;
    }
    const rows = data.map(item => {
      const [, classe] = STATUS[item.status] || ["", "aviso"];
      const acao = item.publicado === true ? "Publicar / Atualizar" : "Despublicar";
      const erro = item.error_message ? '<small class="historico-publicacao__erro">' + escapeHtml(item.error_message) + '</small>' : "";
      return '<tr><td>' + escapeHtml(dataBR(item.requested_at)) + '</td><td class="historico-publicacao__path">/' + escapeHtml(normalizarPath(item.path)) + erro + '</td><td>' + escapeHtml(acao) + '</td><td><span class="historico-publicacao__status status-publicacao__badge ' + classe + '">' + escapeHtml(statusBR(item.status)) + '</span></td><td class="historico-publicacao__id">' + escapeHtml(String(item.request_id || "").slice(0,8) || "—") + '</td><td class="historico-publicacao__id">' + escapeHtml(item.content_id || "—") + '</td></tr>';
    }).join("");
    secao.insertAdjacentHTML("beforeend", '<div class="historico-publicacao__subtitulo">Últimas 20 solicitações registradas pelo sistema.</div><div class="historico-publicacao__table-wrap"><table class="historico-publicacao__table"><thead><tr><th>Data</th><th>Página</th><th>Ação</th><th>Status</th><th>ID</th><th>Conteúdo</th></tr></thead><tbody>' + rows + '</tbody></table></div>');
  }

  await atualizar();
  await atualizarHistorico(box);
  const timer = setInterval(atualizar, INTERVALO_MS);
  window.addEventListener("beforeunload", () => clearInterval(timer), { once:true });
  window.addEventListener("publicacao:atualizada", async () => { await atualizar(); await atualizarHistorico(box); });
}
