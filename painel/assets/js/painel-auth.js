// ============================================================
// painel-auth.js — login único; o papel do usuário decide a área
// ============================================================

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.3/+esm";

const SUPABASE_URL = "https://clwaotfbqwvxpykruwed.supabase.co";
// A chave anon/publishable é pública por desenho; RLS e autorização no servidor
// continuam obrigatórias. Nunca colocar service_role/secret key neste arquivo.
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsd2FvdGZicXd2eHB5a3J1d2VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4MDc0OTMsImV4cCI6MjEwNDM4MzQ5M30.Cw9zJU8UIkxhzjI-adNHoRTyNuGingHpTHZ6pjJBgBc";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1`;

const LOGIN_URL = "/painel/";
const TEMPORARY_ERROR_URL = "/painel/?erro=temporario";
const ACCESS_ERROR_URL = "/painel/?erro=acesso";

function redirecionar(url) {
  if (typeof window !== "undefined" && window.location.pathname + window.location.search !== url) {
    window.location.replace(url);
  }
}

// Resolve a área sem conceder permissões por padrão. Falhas de consulta são
// tratadas como "não foi possível validar", nunca como paciente autorizado.
export async function resolverDestino(userId) {
  if (typeof userId !== "string" || !userId.trim()) return null;

  try {
    const { data: perfil, error: erroPerfil } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", userId)
      .maybeSingle();

    if (erroPerfil) return { erro: "temporario" };

    if (perfil?.role === "admin") {
      return { tipo: "admin", nome: perfil.full_name, destino: "/painel/admin/dashboard.html" };
    }

    const { data: paciente, error: erroPaciente } = await supabase
      .from("patients")
      .select("full_name, acesso_painel")
      .eq("user_id", userId)
      .maybeSingle();

    if (erroPaciente) return { erro: "temporario" };
    if (!paciente || paciente.acesso_painel === false) return null;

    return { tipo: "paciente", nome: paciente.full_name, destino: "/painel/paciente/painel.html" };
  } catch {
    return { erro: "temporario" };
  }
}

// A proteção no cliente é uma camada adicional. RLS/servidor precisam validar
// a autorização em toda consulta e mutação sensível.
export async function exigirAdmin() {
  let session;
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      redirecionar(TEMPORARY_ERROR_URL);
      return null;
    }
    session = data?.session;
  } catch {
    redirecionar(TEMPORARY_ERROR_URL);
    return null;
  }

  if (!session?.user?.id) {
    redirecionar(LOGIN_URL);
    return null;
  }

  try {
    const { data: perfil, error } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", session.user.id)
      .maybeSingle();

    if (error) {
      redirecionar(TEMPORARY_ERROR_URL);
      return null;
    }
    if (!perfil || perfil.role !== "admin") {
      redirecionar(ACCESS_ERROR_URL);
      return null;
    }
    return { session, perfil };
  } catch {
    redirecionar(TEMPORARY_ERROR_URL);
    return null;
  }
}

// Paciente precisa existir, estar vinculado ao usuário autenticado e não estar
// bloqueado. Falha temporária de consulta não encerra a sessão por reflexo.
export async function exigirPaciente() {
  let session;
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      redirecionar(TEMPORARY_ERROR_URL);
      return null;
    }
    session = data?.session;
  } catch {
    redirecionar(TEMPORARY_ERROR_URL);
    return null;
  }

  if (!session?.user?.id) {
    redirecionar(LOGIN_URL);
    return null;
  }

  try {
    const { data: paciente, error } = await supabase
      .from("patients")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (error) {
      redirecionar(TEMPORARY_ERROR_URL);
      return null;
    }
    if (!paciente || paciente.acesso_painel === false) {
      redirecionar(ACCESS_ERROR_URL);
      return null;
    }
    return { session, paciente };
  } catch {
    redirecionar(TEMPORARY_ERROR_URL);
    return null;
  }
}

export function configurarBotaoSair(seletor = "[data-sair]") {
  document.querySelectorAll(seletor).forEach((btn) => {
    if (btn.dataset.logoutBound === "true") return;
    btn.dataset.logoutBound = "true";

    btn.addEventListener("click", async () => {
      if (btn.dataset.logoutPending === "true") return;
      btn.dataset.logoutPending = "true";
      const botoes = [...document.querySelectorAll(seletor)];
      botoes.forEach((item) => { item.disabled = true; });

      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          // Se o servidor não confirmar a saída, tente ao menos encerrar a
          // sessão local e remova a interface privada antes de redirecionar.
          try { await supabase.auth.signOut({ scope: "local" }); } catch {}
          document.querySelectorAll("[data-private-content]").forEach((el) => el.replaceChildren());
          redirecionar("/painel/?erro=saida");
          return;
        }
        document.querySelectorAll("[data-private-content]").forEach((el) => el.replaceChildren());
        redirecionar(LOGIN_URL);
      } catch {
        try { await supabase.auth.signOut({ scope: "local" }); } catch {}
        document.querySelectorAll("[data-private-content]").forEach((el) => el.replaceChildren());
        redirecionar("/painel/?erro=saida");
      } finally {
        botoes.forEach((item) => { item.disabled = true; });
      }
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
    const alvoEvento = evento.target;
    const botao = alvoEvento instanceof Element ? alvoEvento.closest(seletor) : null;
    if (!botao) return;
    const alvo = document.getElementById(botao.dataset.copiarAlvo);
    if (alvo) copiarTexto(alvo.textContent.trim(), botao);
  });
}
