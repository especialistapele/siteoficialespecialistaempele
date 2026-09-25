// ============================================================
// Biblioteca compartilhada pelos geradores de páginas estáticas
// de Blog (scripts/gerar-paginas-artigos.mjs) e Resultados
// (scripts/gerar-paginas-resultados.mjs).
//
// Concentra o que é igual nos dois: slug, escape, sanitização do
// texto rico, layout (cabeçalho/rodapé), leitura das dimensões das
// imagens e — principalmente — a SINCRONIZAÇÃO DA PASTA, que é o que
// implementa despublicação, remoção, troca de slug (redirecionamento)
// e proteção contra sobrescrever página de outro conteúdo.
//
// Cada página gerada carrega <meta name="conteudo-id" content="BLOG-000001">.
// É esse marcador (e não o nome do arquivo) que liga o arquivo ao conteúdo.
// ============================================================

import { readFileSync, writeFileSync, readdirSync, unlinkSync, existsSync, mkdirSync } from "node:fs";

export const SITE = "https://www.especialistaempele.com.br";
export const SUPABASE_URL = process.env.SUPABASE_URL || "https://clwaotfbqwvxpykruwed.supabase.co";
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Mesma regra de slug do banco (função slugify_conteudo), de
// assets/js/blog-data.js e de scripts/gerar-sitemap.mjs.
export function slugifyUrl(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

export function dataBR(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" });
}
export function dataISO(iso) {
  if (!iso) return undefined;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

// Só aceita http(s) — nunca javascript: etc.
export function urlSegura(valor, { relativa = false } = {}) {
  const raw = String(valor ?? "").trim();
  if (!raw) return "";
  if (relativa && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  try {
    const u = new URL(raw);
    return u.protocol === "https:" || u.protocol === "http:" ? u.href : "";
  } catch { return ""; }
}

// ------------------------------------------------------------
// Texto rico. Espelha assets/js/rich-text.js: só passa a formatação
// que o editor do painel produz. Defesa em profundidade (o painel
// já sanitiza antes de salvar).
// ------------------------------------------------------------
const TAGS_OK = new Set(["b", "strong", "i", "em", "u", "span", "p", "br", "div", "h2", "h3", "ul", "ol", "li"]);
const ESTILOS_OK = new Set(["font-size", "text-align", "font-weight", "font-style"]);

export function sanitizarHtmlRico(html) {
  return String(html ?? "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|iframe|object|embed)\b[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (m, tag, attrs) => {
      tag = tag.toLowerCase();
      if (!TAGS_OK.has(tag)) return "";
      if (m.startsWith("</")) return `</${tag}>`;
      let estilo = "";
      const achado = /style\s*=\s*("([^"]*)"|'([^']*)')/i.exec(attrs);
      if (achado) {
        const decls = (achado[2] ?? achado[3] ?? "").split(";")
          .map((d) => d.split(":").map((x) => x.trim()))
          .filter(([p, v]) => p && v && ESTILOS_OK.has(p.toLowerCase()) && /^[\w\s.%#-]+$/.test(v))
          .map(([p, v]) => `${p.toLowerCase()}:${v}`);
        if (decls.length) estilo = ` style="${decls.join(";")}"`;
      }
      return `<${tag}${estilo}${tag === "br" ? " /" : ""}>`;
    });
}
export function pareceHtml(valor) {
  return /<\/?[a-z][\s\S]*>/i.test(String(valor ?? ""));
}
export function paragrafar(texto) {
  return String(texto ?? "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`).join("");
}
export function renderizarConteudo(texto) {
  return pareceHtml(texto) ? sanitizarHtmlRico(texto) : paragrafar(texto);
}
export function textoPuro(html) {
  return String(html ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, " ").trim();
}
// Meta description: até ~158 caracteres, cortada em fim de palavra.
export function resumir(texto, max = 158) {
  const t = String(texto ?? "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const corte = t.slice(0, max - 1);
  return corte.replace(/\s+\S*$/, "").replace(/[,;:\-–—\s]+$/, "") + "…";
}

// ------------------------------------------------------------
// Acesso ao Supabase (REST). Mesma chave anon dos outros scripts.
// ------------------------------------------------------------
export async function buscar(caminho) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${caminho}`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  });
  if (!resp.ok) throw new Error(`Erro ao buscar "${caminho}": ${resp.status} ${await resp.text()}`);
  return resp.json();
}

// ------------------------------------------------------------
// Dimensões da imagem (largura/altura) lidas do cabeçalho do arquivo.
// Evita layout shift (CLS) e ajuda o Google Imagens. Se falhar,
// devolve null e a página simplesmente sai sem width/height.
// ------------------------------------------------------------
const cacheDim = new Map();
export function lerDimensoes(buf) {
  const b = Buffer.from(buf);
  if (b.length > 30 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") {
    const t = b.toString("ascii", 12, 16);
    if (t === "VP8X") return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
    if (t === "VP8L") { const v = b.readUInt32LE(21); return { w: 1 + (v & 0x3fff), h: 1 + ((v >> 14) & 0x3fff) }; }
    if (t === "VP8 ") return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
  }
  if (b.length > 24 && b.readUInt32BE(0) === 0x89504e47) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
      i += 2 + b.readUInt16BE(i + 2);
    }
  }
  return null;
}
export async function dimensoesImagem(url) {
  if (!url || process.env.SEM_DIMENSOES === "1") return null;
  if (cacheDim.has(url)) return cacheDim.get(url);
  let dim = null;
  try {
    const r = await fetch(url, { headers: { Range: "bytes=0-65535" }, signal: AbortSignal.timeout(15000) });
    if (r.ok || r.status === 206) dim = lerDimensoes(await r.arrayBuffer());
  } catch { /* sem dimensões: a página continua válida */ }
  cacheDim.set(url, dim);
  return dim;
}
export const attrDim = (d) => (d ? ` width="${d.w}" height="${d.h}"` : "");

// ------------------------------------------------------------
// Layout (idêntico ao das páginas de artigo/tratamento existentes)
// ------------------------------------------------------------
const ZAP = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M20.5 11.9a8.4 8.4 0 1 1-3.6-6.9L20.5 4l-1 3.4a8.3 8.3 0 0 1 1 4.5Z" stroke-linecap="round" stroke-linejoin="round"/><path d="M8.3 8.3c-.3 1 .4 2.6 1.5 3.9 1.2 1.4 2.7 2.2 3.9 2.1.5 0 1.4-.5 1.6-1l.2-.7-2-1-.5.7c-.9-.2-1.7-.8-2.3-1.6L11.4 10l-1-2-.7.1c-.6.1-1.2.6-1.4 1.2Z" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export function cabecalho(ativo) {
  const a = (chave, href, texto) => `<a href="${href}"${ativo === chave ? ' aria-current="page"' : ""}>${texto}</a>`;
  return `<header class="site-nav-interna">
  <div class="nav-inner-interna">
    <a href="/" class="logo-interna"><img src="/assets/logo-especialista.webp" alt="Especialista em Pele"></a>
    <button type="button" class="nav-toggle" aria-label="Abrir menu" aria-expanded="false" aria-controls="menu-principal"><span></span><span></span><span></span></button>
    <nav class="nav-links-interna" id="menu-principal" aria-label="Menu principal">
      <a href="/pele.html">A Pele</a><a href="/quemsomos.html">Quem Somos</a>
      <a href="/tratamentos/">Regeneração</a><a href="/nanotecnologia.html">Nanotecnologia</a>
      ${a("blog", "/blog/", "Conhecimento")}<a href="/contato.html">Consulta</a>
    </nav>
    <a class="nav-login-interna" href="/painel/">Login Paciente</a>
  </div>
</header>`;
}

export function rodape() {
  return `<footer class="site-footer">
  <div class="footer-inner">
    <div class="footer-grid">
      <div class="footer-col">
        <a class="footer-brand" href="/"><img class="footer-logo" src="/assets/logo-especialista.webp" alt="Especialista em Pele"></a>
        <p class="footer-tagline">Araruama • Cabo Frio • Copacabana • Todo Brasil — Consultoria Regenerativa</p>
        <div class="footer-social">
          <a href="https://instagram.com/especialistaempele" target="_blank" rel="noopener" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17" cy="7" r="0.8" fill="currentColor" stroke="none"/></svg></a>
          <a data-whatsapp-link href="#" aria-label="WhatsApp">${ZAP}</a>
        </div>
      </div>
      <div class="footer-col"><h4>Navegação</h4><ul><li><a href="/pele.html">A Pele</a></li><li><a href="/quemsomos.html">Quem Somos</a></li><li><a href="/tratamentos/">Regeneração</a></li><li><a href="/blog/">Conhecimento</a></li><li><a href="/resultados/">Resultados</a></li></ul></div>
      <div class="footer-col"><h4>Institucional</h4><ul><li><a href="/depoimentos.html">Depoimentos</a></li><li><a href="/pre-atendimento/">Pré-atendimento</a></li><li><a href="/privacidade.html">Política de Privacidade</a></li><li><a href="/cookies.html">Política de Cookies</a></li>
<li><a href="/consultoriaonline.html">Consultoria Online</a></li></ul></div>
      <div class="footer-col"><h4>Contato</h4><ul><li><a data-whatsapp-link href="#">(21) 99219-7518</a></li><li><a href="https://instagram.com/especialistaempele" target="_blank" rel="noopener">@especialistaempele</a></li><li><a href="/estetica-regenerativa-araruama.html">Araruama</a></li><li><a href="/estetica-regenerativa-cabo-frio-riviera.html">Cabo Frio/Riviera</a></li><li><a href="/estetica-regenerativa-copacabana.html">Copacabana</a></li></ul></div>
    </div>
    <p class="footer-base">© 2026 Especialista em Pele — Todos os direitos reservados — Feito por Yansix com <span class="coracao">♥</span></p>
  </div>
</footer>
<a class="whatsapp-flutuante" data-whatsapp-link href="#" aria-label="Falar no WhatsApp">${ZAP}</a>
<div class="cookie-banner" data-cookie-banner>
  <p>Usamos cookies para melhorar sua experiência. <a href="/cookies.html">Saiba mais</a>.</p>
  <div class="cookie-banner__acoes"><button class="btn btn-dourado" data-cookie-aceitar>Aceitar</button><button class="btn btn-fora" data-cookie-recusar>Recusar</button></div>
</div>
<script src="/assets/js/whatsapp.js" defer></script>
<script type="module" src="/assets/js/cookies.js"></script>
<script src="/assets/js/mobile-nav.js" defer></script>`;
}

export const marcadorId = (id) => `<meta name="conteudo-id" content="${escapeHtml(id)}">`;

// Página de redirecionamento (GitHub Pages não executa 301 de verdade —
// veja LEIA-ME-paginas-estaticas.md). Meta refresh imediato + canonical
// para a URL nova é o padrão que o Google trata como redirecionamento permanente.
export function paginaRedirecionamento(id, destinoAbsoluto) {
  const u = escapeHtml(destinoAbsoluto);
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Página movida — Especialista em Pele</title>
${marcadorId(id)}
<meta name="conteudo-movido-para" content="${u}">
<link rel="canonical" href="${u}">
<meta http-equiv="refresh" content="0; url=${u}">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script>location.replace(${JSON.stringify(destinoAbsoluto)});</script>
</head>
<body>
<p>Esta página mudou de endereço. <a href="${u}">Clique aqui para acessar o novo endereço</a>.</p>
</body>
</html>
`;
}

// ------------------------------------------------------------
// SINCRONIZAÇÃO DA PASTA
//
// itens: [{ id, slug, html }]  — somente conteúdo PUBLICADO.
// pastas: pastas onde arquivos com marcador podem existir. A primeira
//         é a pasta "de verdade"; as demais (ex.: blog/artigos/, URL
//         antiga dos artigos) só recebem redirecionamentos.
//
// Regras:
//  - arquivo com marcador cujo id está publicado e cujo caminho é o
//    atual              -> é atualizado (página completa)
//  - id publicado, mas caminho antigo   -> vira redirecionamento p/ URL atual
//  - id NÃO publicado (despublicado/removido/consent revogado) -> arquivo apagado (404)
//  - arquivo sem marcador -> nunca é tocado (exceto via resolverLegado)
//  - página de OUTRO id no caminho desejado -> não sobrescreve (erro)
//  - trava de segurança contra apagar mais da metade de uma vez
// ------------------------------------------------------------
function idDoArquivo(caminho) {
  const m = /<meta name="conteudo-id" content="([^"]+)">/.exec(readFileSync(caminho, "utf-8"));
  return m ? m[1] : null;
}
function escreverSeMudou(caminho, conteudo) {
  if (existsSync(caminho) && readFileSync(caminho, "utf-8") === conteudo) return false;
  writeFileSync(caminho, conteudo, "utf-8");
  return true;
}

export function sincronizarPastas({ pastas, urlBase, itens, resolverLegado = null, log = console.log }) {
  const [principal] = pastas;
  for (const p of pastas) mkdirSync(p, { recursive: true });
  const porId = new Map(itens.map((i) => [i.id, i]));
  const relatorio = { criadas: [], atualizadas: [], redirecionadas: [], removidas: [], erros: [], legadasIgnoradas: [] };

  // 1) inventário do que existe
  const existentes = [];
  for (const pasta of pastas) {
    for (const nome of readdirSync(pasta)) {
      if (!nome.endsWith(".html") || nome === "index.html") continue;
      const caminho = `${pasta}/${nome}`;
      let id = idDoArquivo(caminho);
      if (!id && resolverLegado && pasta !== principal) id = resolverLegado(nome.replace(/\.html$/, ""));
      if (!id) { relatorio.legadasIgnoradas.push(caminho); continue; }
      existentes.push({ pasta, nome, caminho, id });
    }
  }

  // 2) trava de segurança: nunca apagar em massa por engano
  const aApagar = existentes.filter((e) => !porId.has(e.id));
  const paginasReais = existentes.filter((e) => e.pasta === principal).length;
  if (aApagar.length > 3 && aApagar.length > existentes.length / 2 && process.env.FORCAR_LIMPEZA !== "1") {
    throw new Error(`Trava de segurança: a execução apagaria ${aApagar.length} de ${existentes.length} páginas (${paginasReais} reais). ` +
      `Isso costuma indicar falha na leitura do banco. Se for intencional, rode com FORCAR_LIMPEZA=1.`);
  }

  // 3) apagar o que saiu do ar (despublicado ou removido) — 404 no site
  for (const e of aApagar) { unlinkSync(e.caminho); relatorio.removidas.push(e.caminho); }

  // 4) redirecionamentos (URL antiga -> URL atual do mesmo id)
  for (const e of existentes) {
    const item = porId.get(e.id);
    if (!item) continue;
    const ehCaminhoAtual = e.pasta === principal && e.nome === `${item.slug}.html`;
    if (ehCaminhoAtual) continue;
    const destino = `${urlBase}/${item.slug}.html`;
    if (escreverSeMudou(e.caminho, paginaRedirecionamento(e.id, destino))) relatorio.redirecionadas.push(`${e.caminho} -> ${destino}`);
  }

  // 5) páginas completas
  for (const item of itens) {
    const caminho = `${principal}/${item.slug}.html`;
    if (existsSync(caminho)) {
      const dono = idDoArquivo(caminho);
      if (dono && dono !== item.id) {
        relatorio.erros.push(`${caminho} pertence a ${dono}; ${item.id} não pode sobrescrevê-la.`);
        continue;
      }
      if (!dono) {
        relatorio.erros.push(`${caminho} existe sem marcador (arquivo manual?); ${item.id} não vai sobrescrevê-lo.`);
        continue;
      }
    }
    const existia = existsSync(caminho);
    if (escreverSeMudou(caminho, item.html)) (existia ? relatorio.atualizadas : relatorio.criadas).push(caminho);
  }

  for (const [k, v] of Object.entries(relatorio)) if (v.length) log(`${k}: ${v.length}`), v.forEach((x) => log(`  - ${x}`));
  return relatorio;
}

// Substitui o trecho entre <!--LISTA-INICIO--> e <!--LISTA-FIM--> num index.html.
export function injetarLista(arquivo, html) {
  const src = readFileSync(arquivo, "utf-8");
  const re = /<!--LISTA-INICIO-->[\s\S]*?<!--LISTA-FIM-->/;
  if (!re.test(src)) throw new Error(`${arquivo}: marcadores <!--LISTA-INICIO--> / <!--LISTA-FIM--> não encontrados.`);
  const novo = src.replace(re, () => `<!--LISTA-INICIO-->${html}<!--LISTA-FIM-->`);
  if (novo !== src) writeFileSync(arquivo, novo, "utf-8");
  return novo !== src;
}
