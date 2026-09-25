// ============================================================
// Pede ao GitHub (via Edge Function "disparar-publicacao") que
// regenere as páginas estáticas e o sitemap agora, em vez de
// esperar a próxima execução agendada.
//
// É "melhor esforço": se a função não estiver configurada ou
// falhar, o site continua sendo atualizado pela execução
// agendada do GitHub Actions (de hora em hora).
// ============================================================

import { supabase } from "./painel-auth.js";

export async function dispararPublicacao() {
  try {
    const { data, error } = await supabase.functions.invoke("disparar-publicacao", { body: {} });
    if (error) return false;
    return !!data?.ok;
  } catch (_) {
    return false;
  }
}

export const MSG_ATUALIZANDO = "O site está sendo atualizado (leva cerca de 1 a 3 minutos).";
export const MSG_AGENDADO = "O site será atualizado automaticamente na próxima execução agendada (até 1 hora).";

// Mesma regra de slug do banco e dos scripts (minúsculas, sem acento, hífens).
export function slugificar(valor) {
  return String(valor ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70).replace(/-+$/g, "");
}
