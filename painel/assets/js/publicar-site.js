// ============================================================
// Disparo e confirmação da publicação estática.
// ============================================================

import { supabase } from "./painel-auth.js";

const MANIFEST_URL = "/publicacao-manifest.json";
const TEMPO_MAXIMO_MS = 150000;
const INTERVALO_MS = 5000;

async function atualizarSolicitacao(requestId, status) {
  if (!requestId || !status) return;
  const payload = {
    status,
    updated_at: new Date().toISOString(),
    ...(status === "confirmed" ? { confirmed_at: new Date().toISOString() } : {}),
  };
  try {
    await supabase.from("publication_requests").update(payload).eq("request_id", requestId);
  } catch (_) {}
}

async function lerManifesto() {
  try {
    const resposta = await fetch(`${MANIFEST_URL}?t=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    });
    if (!resposta.ok) return null;
    return await resposta.json();
  } catch (_) {
    return null;
  }
}

function assinatura(manifesto) {
  if (!manifesto) return "";
  return JSON.stringify((manifesto.items || []).map((item) => ({
    path: item.path, id: item.id, status: item.status,
    canonical: item.canonical, redirect_to: item.redirect_to, sha256: item.sha256,
  })));
}

function alvoAtingido(manifesto, alvo) {
  if (!alvo?.path) return true;
  const item = (manifesto?.items || []).find((x) => x.path === alvo.path);
  if (alvo.publicado === false) return !item;
  if (alvo.publicado === true) return !!item && item.status === "published";
  return true;
}

export async function dispararPublicacao({ path = null, publicado = null } = {}) {
  const antes = await lerManifesto();
  const assinaturaAntes = assinatura(antes);
  let requestId = null;

  try {
    const { data, error } = await supabase.functions.invoke("disparar-publicacao", {
      body: { path, publicado },
    });
    requestId = data?.request_id || null;
    if (error || !data?.ok) {
      await atualizarSolicitacao(requestId, "error");
      return { ok: false, confirmado: false, request_id: requestId };
    }

    const inicio = Date.now();
    while (Date.now() - inicio < TEMPO_MAXIMO_MS) {
      await new Promise((resolve) => setTimeout(resolve, INTERVALO_MS));
      const atual = await lerManifesto();
      if (atual && assinatura(atual) !== assinaturaAntes && alvoAtingido(atual, { path, publicado })) {
        await atualizarSolicitacao(requestId, "confirmed");
        return { ok: true, confirmado: true, request_id: requestId };
      }
    }

    await atualizarSolicitacao(requestId, "timeout");
    return { ok: true, confirmado: false, request_id: requestId };
  } catch (_) {
    await atualizarSolicitacao(requestId, "error");
    return { ok: false, confirmado: false, request_id: requestId };
  }
}

export const MSG_ATUALIZANDO = "Publicação solicitada. Aguardando confirmação no site…";
export const MSG_CONFIRMADO = "Publicação confirmada no site.";
export const MSG_AGENDADO = "Não foi possível confirmar a publicação agora. O site continuará sendo atualizado automaticamente na próxima execução.";

export function slugificar(valor) {
  return String(valor ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70).replace(/-+$/g, "");
}
