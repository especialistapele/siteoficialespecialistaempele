import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const ROOT = process.cwd();
const errors = [];
const warnings = [];

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function parseGlobalConfig(source) {
  const sandbox = { window: {} };
  vm.runInNewContext(source, sandbox, { timeout: 1000 });
  return sandbox.window.ESPECIALISTA_PELE_BOT_CONFIG;
}

function extractObject(source, marker) {
  const start = source.indexOf(marker);
  if (start < 0) throw new Error("Bloco não encontrado: " + marker);
  const open = source.indexOf("{", start);
  if (open < 0) throw new Error("Abertura do objeto não encontrada: " + marker);

  let depth = 0;
  let quote = null;
  let escaped = false;

  for (let i = open; i < source.length; i++) {
    const char = source[i];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === "'" || char === '"' || char === "`") {
      quote = char;
      continue;
    }

    if (char === "{") depth++;
    if (char === "}") {
      depth--;
      if (depth === 0) {
        return source.slice(open, i + 1);
      }
    }
  }

  throw new Error("Fim do objeto não encontrado: " + marker);
}

function parseAliases(source) {
  const objectSource = extractObject(source, "const aliases =");
  return Function('"use strict"; return (' + objectSource + ");")();
}

const configSource = read("assets/js/bot-config.js");
const botSource = read("assets/js/bot-triagem.js");
const whatsappSource = read("assets/js/whatsapp.js");
const config = parseGlobalConfig(configSource);
const aliases = parseAliases(botSource);
const autoPath = path.join(ROOT, "assets/js/bot-tratamentos-auto.js");
const autoSource = fs.existsSync(autoPath) ? read("assets/js/bot-tratamentos-auto.js") : "";
const auto = autoSource ? parseGlobalConfig(autoSource.replace("window.ESPECIALISTA_PELE_BOT_AUTO", "window.ESPECIALISTA_PELE_BOT_CONFIG")) : {};

const treatmentDir = path.join(ROOT, "tratamentos");
const treatmentFiles = fs.readdirSync(treatmentDir)
  .filter((file) => file.endsWith(".html") && file !== "index.html")
  .sort();

const treatmentPaths = treatmentFiles.map((file) => "/tratamentos/" + file);

console.log("=== Auditor do Atendente Virtual — Camada 2A ===");

console.log("Páginas de tratamento encontradas:", treatmentFiles.length);

if (!fs.existsSync(path.join(ROOT, "assets/js/bot-config.js"))) {
  fail("bot-config.js não encontrado.");
}
if (!fs.existsSync(path.join(ROOT, "assets/js/bot-triagem.js"))) {
  fail("bot-triagem.js não encontrado.");
}
if (!fs.existsSync(path.join(ROOT, "assets/js/whatsapp.js"))) {
  fail("whatsapp.js não encontrado.");
}

if (!whatsappSource.includes('src = "/assets/js/bot-config.js"')) {
  fail("whatsapp.js não carrega bot-config.js.");
}
if (!whatsappSource.includes('engine.src = "/assets/js/bot-triagem.js"')) {
  fail("whatsapp.js não carrega bot-triagem.js.");
}
if (!whatsappSource.includes("data-ep-bot-engine")) {
  fail("whatsapp.js não possui proteção contra carregamento duplicado do motor.");
}
if (!whatsappSource.includes('src = "/assets/js/bot-tratamentos-auto.js"')) {
  fail("whatsapp.js não carrega o manifesto automático de tratamentos.");
}
if (!fs.existsSync(autoPath)) {
  fail("bot-tratamentos-auto.js não foi gerado.");
}

const effectiveModes = { ...(auto.treatmentModes || {}), ...(config.treatmentModes || {}) };
const effectiveContexts = { ...(auto.pageContexts || {}), ...(config.pageContexts || {}) };
const effectiveGreetings = { ...(auto.greetings || {}), ...(config.greetings || {}) };
const effectiveLabels = { ...(auto.labels || {}), ...(config.labels || {}) };
const effectiveAliases = { ...(auto.aliases || {}), ...aliases };
const configuredTreatmentPaths = Object.entries(effectiveContexts)
  .filter(([, context]) => context)
  .map(([pagePath]) => pagePath)
  .filter((pagePath) => pagePath.startsWith("/tratamentos/"))
  .sort();
console.log("Contextos de tratamento configurados:", configuredTreatmentPaths.length);
const modes = effectiveModes;
const modeKeys = Object.keys(modes).sort();
const linkedContexts = [...new Set(
  configuredTreatmentPaths
    .map((pagePath) => effectiveContexts[pagePath])
    .filter((context) => context)
)].sort();
if (linkedContexts.length !== treatmentFiles.length) {
  fail(
    "Quantidade divergente: " +
    linkedContexts.length +
    " contextos vinculados no bot para " +
    treatmentFiles.length +
    " páginas em /tratamentos."
  );
}

for (const file of treatmentFiles) {
  const pagePath = "/tratamentos/" + file;
  const html = read("tratamentos/" + file);
  const context = effectiveContexts[pagePath];

  if (!context) {
    fail(pagePath + ": sem contexto em effectiveContexts.");
    continue;
  }

  if (context === "home" || context === "consultoria" || context === "consulta" || context === "pele" || context === "profissional") {
    fail(pagePath + ": contexto '" + context + "' não representa um tratamento.");
  }

  if (!html.match(/<script[^>]+src=["']\/assets\/js\/whatsapp\.js["'][^>]*>/i)) {
    fail(pagePath + ": não carrega /assets/js/whatsapp.js.");
  }

  if (/<script[^>]+src=["'][^"']*bot-triagem\.js["'][^>]*>/i.test(html)) {
    fail(pagePath + ": carrega bot-triagem.js diretamente; a instalação deve ser feita pelo loader central.");
  }

  const bodyMatch = html.match(/<body\b[^>]*data-pagina=["']([^"']+)["']/i);
  if (!bodyMatch) {
    warn(pagePath + ": body sem data-pagina; o loader ainda pode funcionar, mas a página perdeu seu identificador geral.");
  }

  const mode = modes[context];
  if (!mode) {
    fail(pagePath + ": contexto '" + context + "' não existe em treatmentModes.");
    continue;
  }

  if (mode.presential !== true) {
    fail(pagePath + ": tratamento sem presential=true.");
  }

  if (mode.online !== false && mode.online !== "consulta") {
    fail(pagePath + ": modalidade online inválida: " + String(mode.online));
  }

  if (mode.online === "consulta" && mode.requiresPreAttendance !== true) {
    fail(pagePath + ": consulta online sem requiresPreAttendance=true.");
  }

  if (!effectiveGreetings?.[context]) {
    fail(pagePath + ": contexto '" + context + "' sem saudação específica.");
  }

  if (!effectiveLabels?.[context]) {
    fail(pagePath + ": contexto '" + context + "' sem label específico.");
  }

  if (!Array.isArray(effectiveAliases[context]) || effectiveAliases[context].length === 0) {
    fail(pagePath + ": contexto '" + context + "' sem alias no motor.");
  }
}

for (const pagePath of configuredTreatmentPaths) {
  const file = pagePath.replace(/^\/tratamentos\//, "");
  if (!treatmentFiles.includes(file)) {
    fail("Configuração aponta para página inexistente: " + pagePath);
  }
}

for (const context of linkedContexts) {
  if (!effectiveGreetings?.[context]) {
    fail("Contexto '" + context + "' sem greeting.");
  }

  if (!effectiveLabels?.[context]) {
    fail("Contexto '" + context + "' sem label.");
  }

  if (!modes[context]) {
    fail("Contexto '" + context + "' sem modalidade em treatmentModes.");
  }

  if (!Array.isArray(effectiveAliases[context]) || effectiveAliases[context].length === 0) {
    fail("Contexto '" + context + "' sem alias.");
  }
}

const treatmentPageContexts = treatmentPaths
  .map((pagePath) => effectiveContexts[pagePath])
  .filter(Boolean);
const duplicateContexts = treatmentPageContexts.filter(
  (context, index, list) => list.indexOf(context) !== index
);

if (duplicateContexts.length) {
  warn("Contextos repetidos entre páginas: " + [...new Set(duplicateContexts)].join(", "));
}

const loaderCoverage = {
  botCss: /bot-triagem\.css/.test(whatsappSource),
  botConfig: /bot-config\.js/.test(whatsappSource),
  botEngine: /bot-triagem\.js/.test(whatsappSource)
};

if (!loaderCoverage.botCss) fail("Loader central sem bot-triagem.css.");
if (!loaderCoverage.botConfig) fail("Loader central sem bot-config.js.");
if (!loaderCoverage.botEngine) fail("Loader central sem bot-triagem.js.");

const result = {
  status: errors.length ? "fail" : "ok",
  treatmentPages: treatmentFiles.length,
  configuredTreatmentPaths: configuredTreatmentPaths.length,
  treatmentModes: modeKeys.length,
  autoTreatmentPages: Object.keys(auto.pageContexts || {}).length,
  errors,
  warnings
};

console.log(JSON.stringify(result, null, 2));

if (errors.length) {
  console.error("\nAUDITORIA DO BOT: FALHOU");
  process.exit(1);
}

console.log("\nAUDITORIA DO BOT: OK — todas as páginas de tratamento estão integradas ao loader e possuem configuração contextual.");


const historyMigration = readFileSync("supabase/migrations/20261004200000_bot_messages_session_guard.sql", "utf8");
if (!historyMigration.includes("add column if not exists session_id uuid")) throw new Error("Migration incremental sem coluna session_id.");
if (!/c\\.session_id = bot_messages\\.session_id/i.test(historyMigration)) throw new Error("Política de mensagens sem validação do session_id da conversa.");
if (!/alter column session_id set not null/i.test(historyMigration)) throw new Error("session_id não está protegido como obrigatório.");
