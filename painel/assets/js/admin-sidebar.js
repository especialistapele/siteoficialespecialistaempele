// ============================================================
// admin-sidebar.js — sidebar reutilizável do painel administrativo
// ============================================================

const ICONES = {
  notificacoes: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"/><path d="M10 21h4"/></svg>`,
  dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>`,
  pacientes: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="9" cy="8" r="3.2"/><path d="M3 19c0-3 2.7-5.2 6-5.2s6 2.2 6 5.2"/><circle cx="17" cy="8" r="2.4"/><path d="M15 13.6c2.4.2 4.2 2.1 4.2 5"/></svg>`,
  blog: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 6.5c-1.6-1-4-1.5-6.5-1.5v13c2.5 0 4.9.5 6.5 1.5 1.6-1 4-1.5 6.5-1.5v-13c-2.5 0-4.9.5-6.5 1.5Z"/><path d="M12 6.5v13"/></svg>`,
  depoimentos: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M7 10h.01M12 10h.01M17 10h.01"/><path d="M4 5h16v10H8l-4 4V5Z"/></svg>`,
  tratamentos: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 19c8-1 12-6 13-13-8 1-13 5-13 13Z"/><path d="M5 19c2-4 5-7 9-9"/></svg>`,
  promocoes: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 7.5 12 3l9 4.5-9 4.5-9-4.5Z"/><path d="M3 12l9 4.5 9-4.5M3 16.5 12 21l9-4.5"/></svg>`,
  resultados: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="4" width="18" height="14" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 15l-5-4-4 3-3-2-6 5"/></svg>`,
  documentos: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M6 3h9l4 4v14H6V3Z"/><path d="M15 3v4h4"/></svg>`,
  contratos: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 20c4 0 5-2 8-2s3 2 6 2"/><path d="M14.5 3.5l6 6L11 19l-5 1 1-5Z"/></svg>`,
  anuncios: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 5h16v11H8l-4 4V5Z"/><path d="M8 9h8M8 12h5"/></svg>`,
  "pre-atendimentos": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>`,
  configuracoes: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="3"/><path d="M19.4 13a7.6 7.6 0 0 0 0-2l2-1.5-2-3.4-2.3.7a7.6 7.6 0 0 0-1.7-1L15 3h-6l-.4 2.8a7.6 7.6 0 0 0-1.7 1l-2.3-.7-2 3.4L4.6 11a7.6 7.6 0 0 0 0 2l-2 1.5 2 3.4 2.3-.7c.5.4 1.1.75 1.7 1L9 21h6l.4-2.8c.6-.25 1.2-.6 1.7-1l2.3.7 2-3.4-2-1.5Z"/></svg>`,
  agenda: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 9h18M7 13h3M14 13h3M7 17h3"/></svg>`,
  financeiro: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 7h16v12H4z"/><path d="M4 9h16M8 13h3"/></svg>`,
  "atendente-virtual": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 5h14v11H8l-3 3V5Z"/><path d="M8 9h8M8 12h5"/></svg>`,
  skinmap: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><path d="M12 3c-2 3-2 6 0 9s2 6 0 9M3 12h18M6 6c2 1 4 1 6 0s4-1 6 0M6 18c2-1 4-1 6 0s4 1 6 0"/></svg>`,
  marketing: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 11v2l13 4V7L3 11Z"/><path d="M16 9.5c2.5 0 4 1 4 2.5s-1.5 2.5-4 2.5M6 14l1.5 6h4L10 15"/></svg>`,
  cookies: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M20.5 13A8.5 8.5 0 1 1 11 3.5a5.5 5.5 0 0 0 9.5 9.5Z"/><circle cx="8" cy="10" r="1"/><circle cx="12" cy="15" r="1"/><circle cx="7" cy="16" r=".7"/></svg>`,
  sair: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M15 17l5-5-5-5M20 12H9M12 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6"/></svg>`,
};

const ITENS = [
  { id: "dashboard", label: "Dashboard", href: "/painel/admin/dashboard.html" },
  { id: "notificacoes", label: "Notificações", href: "/painel/admin/notificacoes.html" },
  { id: "marketing", label: "Marketing", groupHeader: true },
  { id: "melhorias-site", label: "Melhorias do site", href: "/painel/admin/melhorias-site.html", group: "marketing" },
  { id: "cookies", label: "Cookies", href: "/painel/admin/cookies.html", group: "marketing" },
  { id: "pacientes", label: "Pacientes", href: "/painel/admin/pacientes.html" },
  { id: "blog", label: "Blog", href: "/painel/admin/blog.html" },
  { id: "depoimentos", label: "Depoimentos", href: "/painel/admin/depoimentos.html" },
  { id: "tratamentos", label: "Tratamentos", href: "/painel/admin/tratamentos.html" },
  { id: "promocoes", label: "Campanhas Promocionais", href: "/painel/admin/promocoes.html" },
  { id: "resultados", label: "Resultados", href: "/painel/admin/resultados.html" },
  { id: "documentos", label: "Documentos", href: "/painel/admin/documentos.html" },
  { id: "contratos", label: "Contratos", href: "/painel/admin/contratos.html" },
  { id: "anuncios", label: "Avisos", href: "/painel/admin/anuncios.html" },
  { id: "agenda", label: "Agenda", href: "/painel/admin/agenda.html" },
  { id: "financeiro", label: "Financeiro", href: "/painel/admin/financeiro.html" },
  { id: "atendente-virtual", label: "Atendente Virtual", href: "/painel/admin/atendente-virtual.html" },
  { id: "pre-atendimentos", label: "Pré-atendimentos", href: "/painel/admin/pre-atendimentos.html" },
  { id: "skinmap", label: "SkinMap", href: "/painel/admin/skinmap.html" },
  { id: "configuracoes", label: "Configurações", href: "/painel/admin/configuracoes.html" },
];

export function renderSidebarAdmin(ativo, nome = "Admin") {
  const iniciaisNome = (nome || "A").split(" ").filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");
  const links = ITENS.map((item) => item.groupHeader
    ? `<div class="painel-sidebar__grupo" style="padding:14px 12px 5px;color:rgba(244,238,227,.48);font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase">${item.label}</div>`
    : `<a href="${item.href}" class="${item.id === ativo ? "ativo" : ""}" ${item.group ? 'style="padding-left:28px;font-size:12.5px"' : ""}>${ICONES[item.id] || ""}<span>${item.label}</span></a>`).join("");

  queueMicrotask(() => configurarMenuAdmin());

  return `
    <button type="button" class="admin-menu-abrir" data-admin-menu-abrir aria-label="Abrir menu administrativo" aria-expanded="false"><span></span><span></span><span></span></button>
    <div class="admin-menu-backdrop" data-admin-menu-backdrop></div>
    <div class="painel-sidebar__inner">
      <button type="button" class="admin-menu-fechar" data-admin-menu-fechar aria-label="Fechar menu">×</button>
      <div class="painel-sidebar__marca">
        <div class="selo-ep"><img src="/painel/assets/img/logo-especialista.webp" alt="Especialista em Pele — Danielle Brito"></div>
      </div>
      <div class="painel-sidebar__perfil">
        <div class="painel-sidebar__avatar">${iniciaisNome}</div>
        <div><div style="font-size:13px;font-weight:700">${nome}</div><small>Administrador</small></div>
      </div>
      <nav>${links}</nav>
      <button class="painel-sidebar__sair" data-sair>${ICONES.sair} Sair</button>
    </div>
  `;
}

export function configurarMenuAdmin() {
  const sidebar = document.querySelector("[data-sidebar]");
  if (!sidebar || sidebar.dataset.menuAdminConfigurado === "1") return;
  sidebar.dataset.menuAdminConfigurado = "1";
  const abrir = sidebar.querySelector("[data-admin-menu-abrir]");
  const fechar = sidebar.querySelector("[data-admin-menu-fechar]");
  const backdrop = sidebar.querySelector("[data-admin-menu-backdrop]");
  const alternar = (aberto) => {
    sidebar.classList.toggle("menu-admin-aberto", aberto);
    document.body.classList.toggle("menu-admin-aberto", aberto);
    abrir?.setAttribute("aria-expanded", String(aberto));
  };
  abrir?.addEventListener("click", () => alternar(true));
  fechar?.addEventListener("click", () => alternar(false));
  backdrop?.addEventListener("click", () => alternar(false));
  sidebar.querySelectorAll("nav a").forEach((link) => link.addEventListener("click", () => alternar(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") alternar(false); });
}
