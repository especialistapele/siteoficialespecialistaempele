// ============================================================
// painel-auth.js — login único; o papel do usuário decide a área
// ============================================================

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://clwaotfbqwvxpykruwed.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsd2FvdGZicXd2eHB5a3J1d2VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4MDc0OTMsImV4cCI6MjEwNDM4MzQ5M30.Cw9zJU8UIkxhzjI-adNHoRTyNuGingHpTHZ6pjJBgBc";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1`;

// Depois do login, descobre se é admin ou paciente e devolve pra onde mandar.
export async function resolverDestino(userId) {
  const { data: perfil } = await supabase.from("profiles").select("role, full_name").eq("id", userId).single();
  if (perfil?.role === "admin") {
    return { tipo: "admin", nome: perfil.full_name, destino: "/painel/admin/dashboard.html" };
  }
  const { data: paciente } = await supabase.from("patients").select("full_name, acesso_painel").eq("user_id", userId).single();
  if (paciente?.acesso_painel !== false) {
    return { tipo: "paciente", nome: paciente.full_name, destino: "/painel/paciente/painel.html" };
  }
  return null;
}

// Protege páginas do lado ADMIN
export async function exigirAdmin() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) { window.location.href = "/painel/"; return null; }
  const { data: perfil, error } = await supabase.from("profiles").select("role, full_name").eq("id", session.user.id).single();
  if (error || !perfil || perfil.role !== "admin") {
    await supabase.auth.signOut();
    window.location.href = "/painel/?erro=acesso";
    return null;
  }
  return { session, perfil };
}

// Protege páginas do lado PACIENTE
export async function exigirPaciente() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) { window.location.href = "/painel/"; return null; }
  const { data: paciente, error } = await supabase.from("patients").select("*").eq("user_id", session.user.id).single();
  if (error || !paciente || paciente.acesso_painel === false) {
    await supabase.auth.signOut();
    window.location.href = "/painel/?erro=acesso";
    return null;
  }
  return { session, paciente };
}

export function configurarBotaoSair(seletor = "[data-sair]") {
  document.querySelectorAll(seletor).forEach((btn) => {
    btn.addEventListener("click", async () => {
      await supabase.auth.signOut();
      window.location.href = "/painel/";
    });
  });
}

export function mostrarFlash(elemento, mensagem, tipo = "sucesso") {
  if (!elemento) return;
  elemento.textContent = mensagem;
  elemento.className = `aviso-flash visivel ${tipo}`;
  elemento.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

export function iniciais(nome) {
  if (!nome) return "?";
  return nome.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");
}

// Copia o texto de um elemento (por id) para a área de transferência e dá
// um retorno visual rápido no próprio botão clicado. Uso:
// <span id="minha-senha">abc123</span>
// <button data-copiar-alvo="minha-senha">Copiar</button>
// configurarBotoesCopiar() uma vez na página já cobre qualquer botão
// [data-copiar-alvo], mesmo os criados dinamicamente depois.
export async function copiarTexto(texto, botao) {
  if (!texto) return;
  try {
    await navigator.clipboard.writeText(texto);
  } catch {
    const campo = document.createElement("textarea");
    campo.value = texto;
    campo.style.position = "fixed";
    campo.style.opacity = "0";
    document.body.appendChild(campo);
    campo.select();
    try { document.execCommand("copy"); } catch {}
    document.body.removeChild(campo);
  }
  if (botao) {
    const textoOriginal = botao.textContent;
    botao.disabled = true;
    botao.textContent = "Copiado!";
    setTimeout(() => { botao.textContent = textoOriginal; botao.disabled = false; }, 1600);
  }
}

export function configurarBotoesCopiar(seletor = "[data-copiar-alvo]") {
  document.addEventListener("click", (evento) => {
    const botao = evento.target.closest(seletor);
    if (!botao) return;
    const alvo = document.getElementById(botao.dataset.copiarAlvo);
    if (alvo) copiarTexto(alvo.textContent.trim(), botao);
  });
}
