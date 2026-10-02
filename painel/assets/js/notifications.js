// notifications.js — centro de notificações do painel administrativo
const DIAS_SEMANA = 7;
const LS_PREFIX = "dq-admin-notificacao-dismissed:";

const ICONES = {
  lead: "👤",
  agenda: "🗓️",
  artigo: "📝",
  resultado: "📸",
};

function chave(item) {
  return LS_PREFIX + item.id;
}

export function estaDispensada(item) {
  return localStorage.getItem(chave(item)) === "1";
}

export function dispensar(item) {
  localStorage.setItem(chave(item), "1");
}

export function limparDispensadas() {
  Object.keys(localStorage)
    .filter((key) => key.startsWith(LS_PREFIX))
    .forEach((key) => localStorage.removeItem(key));
}

function inicioHoje() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function dataHoraAgendamento(item) {
  const valor = `${item.appointment_date}T${String(item.appointment_time || "00:00:00").slice(0, 8)}`;
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatarDataHora(d) {
  if (!d) return "Data não informada";
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatarData(d) {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function diferencaDias(data) {
  return Math.floor((data - inicioHoje()) / 86400000);
}

function textoRelativoAgenda(d) {
  const dias = diferencaDias(d);
  if (dias === 0) return "Hoje";
  if (dias === 1) return "Amanhã";
  if (dias > 1) return `Em ${dias} dias`;
  return "Próximo atendimento";
}

export async function carregarNotificacoes(supabase) {
  const { data: config, error: configError } = await supabase
    .from("configuracoes")
    .select("notificacoes_leads, notificacoes_agenda, notificacoes_artigos, notificacoes_resultados")
    .eq("id", 1)
    .single();

  if (configError) throw configError;

  const itens = [];
  const hoje = inicioHoje();

  if (config.notificacoes_leads) {
    const { data, error } = await supabase
      .from("pre_atendimentos")
      .select("id, full_name, queixa_principal, created_at, status")
      .eq("status", "novo")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw error;

    (data || []).forEach((lead) => {
      itens.push({
        id: `lead:${lead.id}`,
        tipo: "lead",
        titulo: "Novo lead no pré-atendimento",
        descricao: `${lead.full_name} enviou um pré-atendimento${lead.queixa_principal ? ` sobre ${lead.queixa_principal}` : ""}.`,
        detalhe: `Recebido em ${formatarDataHora(new Date(lead.created_at))}`,
        href: "/painel/admin/pre-atendimentos.html",
        data: new Date(lead.created_at),
        prioridade: "alta",
      });
    });
  }

  if (config.notificacoes_agenda) {
    const { data, error } = await supabase
      .from("appointments")
      .select("id, appointment_date, appointment_time, description, tipo, status, patients(full_name)")
      .in("status", ["agendado", "confirmado"])
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true })
      .limit(20);
    if (error) throw error;

    const proximos = (data || [])
      .map((item) => ({ ...item, quando: dataHoraAgendamento(item) }))
      .filter((item) => item.quando && item.quando >= hoje)
      .sort((a, b) => a.quando - b.quando);

    if (proximos[0]) {
      const item = proximos[0];
      itens.push({
        id: `agenda:${item.id}`,
        tipo: "agenda",
        titulo: `Próximo atendimento — ${textoRelativoAgenda(item.quando)}`,
        descricao: item.patients?.full_name || "Paciente sem nome",
        detalhe: `${formatarDataHora(item.quando)}${item.tipo ? ` · ${item.tipo}` : ""}`,
        href: "/painel/admin/agenda.html",
        data: item.quando,
        prioridade: diferencaDias(item.quando) <= 1 ? "alta" : "normal",
      });
    }
  }

  if (config.notificacoes_artigos) {
    const { data, error } = await supabase
      .from("articles")
      .select("id, title, published_at, created_at")
      .eq("published", true)
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(1);
    if (error) throw error;

    const ultimo = data?.[0];
    const ultimaData = ultimo?.published_at ? new Date(ultimo.published_at) : (ultimo?.created_at ? new Date(ultimo.created_at) : null);
    if (!ultimaData || (Date.now() - ultimaData.getTime()) >= DIAS_SEMANA * 86400000) {
      itens.push({
        id: "conteudo:artigo-semanal",
        tipo: "artigo",
        titulo: "Hora de publicar um artigo",
        descricao: ultimo ? `O último artigo publicado foi em ${formatarData(ultimaData)}.` : "Ainda não há artigo publicado.",
        detalhe: "Meta: pelo menos 1 artigo publicado a cada 7 dias.",
        href: "/painel/admin/blog.html",
        data: ultimaData || hoje,
        prioridade: "alta",
      });
    }
  }

  if (config.notificacoes_resultados) {
    const { data, error } = await supabase
      .from("results")
      .select("id, title, published_at, created_at")
      .eq("published", true)
      .eq("consent_confirmed", true)
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(1);
    if (error) throw error;

    const ultimo = data?.[0];
    const ultimaData = ultimo?.published_at ? new Date(ultimo.published_at) : (ultimo?.created_at ? new Date(ultimo.created_at) : null);
    if (!ultimaData || (Date.now() - ultimaData.getTime()) >= DIAS_SEMANA * 86400000) {
      itens.push({
        id: "conteudo:resultado-semanal",
        tipo: "resultado",
        titulo: "Hora de publicar um novo resultado",
        descricao: ultimo ? `O último resultado publicado foi em ${formatarData(ultimaData)}.` : "Ainda não há resultado publicado.",
        detalhe: "Meta: pelo menos 1 resultado publicado a cada 7 dias.",
        href: "/painel/admin/resultados.html",
        data: ultimaData || hoje,
        prioridade: "alta",
      });
    }
  }

  return itens.sort((a, b) => {
    const peso = { alta: 0, normal: 1 };
    return (peso[a.prioridade] - peso[b.prioridade]) || ((b.data?.getTime?.() || 0) - (a.data?.getTime?.() || 0));
  });
}

export function renderNotificacao(item) {
  return `
    <article class="notificacao-item notificacao-item--${item.prioridade}" data-notificacao-id="${item.id}">
      <div class="notificacao-item__icone" aria-hidden="true">${ICONES[item.tipo] || "•"}</div>
      <div class="notificacao-item__corpo">
        <div class="notificacao-item__topo">
          <strong>${item.titulo}</strong>
          <button type="button" class="notificacao-item__fechar" data-dispensar-notificacao="${item.id}" aria-label="Dispensar">×</button>
        </div>
        <p>${item.descricao}</p>
        <small>${item.detalhe}</small>
        <a class="btn-p btn-p-mini btn-p-fora notificacao-item__acao" href="${item.href}">Abrir</a>
      </div>
    </article>`;
}

export function renderResumoNotificacoes(itens) {
  const ativas = itens.filter((item) => !estaDispensada(item));
  if (!ativas.length) return `<div class="notificacoes-vazio"><strong>Tudo em dia.</strong><span>Nenhuma notificação pendente no momento.</span></div>`;
  return ativas.map(renderNotificacao).join("");
}

export function contarAtivas(itens) {
  return itens.filter((item) => !estaDispensada(item)).length;
}

export function ligarDispensas(container, onChange) {
  container.querySelectorAll("[data-dispensar-notificacao]").forEach((btn) => {
    btn.addEventListener("click", () => {
      dispensar({ id: btn.dataset.dispensarNotificacao });
      btn.closest("[data-notificacao-id]")?.remove();
      onChange?.();
    });
  });
}
