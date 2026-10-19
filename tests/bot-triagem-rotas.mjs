import { existsSync, readFileSync, readdirSync } from "node:fs";
import vm from "node:vm";

const sandbox = { window: {} };
vm.runInNewContext(readFileSync("assets/js/bot-config.js", "utf8"), sandbox);
const config = sandbox.window.ESPECIALISTA_PELE_BOT_CONFIG;
if (!config) throw new Error("bot-config.js não expôs ESPECIALISTA_PELE_BOT_CONFIG.");
const autoSandbox = { window: {} };
vm.runInNewContext(readFileSync("assets/js/bot-tratamentos-auto.js", "utf8"), autoSandbox);
const auto = autoSandbox.window.ESPECIALISTA_PELE_BOT_AUTO || {};
for (const section of ["treatmentModes", "pageContexts", "greetings", "labels"]) {
  config[section] = { ...(auto[section] || {}), ...(config[section] || {}) };
}

const tratamentoEntries = Object.entries(config.pageContexts)
  .filter(([path]) => path.startsWith("/tratamentos/"));
const actualRoutes = readdirSync("tratamentos")
  .filter((name) => name.endsWith(".html") && !["index.html", "detalhe.html"].includes(name))
  .map((name) => "/tratamentos/" + name);
const errors = [];
for (const [route, context] of tratamentoEntries) {
  const file = route.replace(/^\\//, "");
  if (!existsSync(file)) errors.push(`Rota ${route}: arquivo inexistente (${file}).`);
  if (!context) errors.push(`Rota ${route}: contexto vazio.`);
}
for (const route of actualRoutes) {
  if (!config.pageContexts[route]) errors.push(`Página sem contexto do bot: ${route}.`);
}
if (tratamentoEntries.length !== actualRoutes.length) {
  errors.push(`Esperados contextos para ${actualRoutes.length} páginas; encontrados ${tratamentoEntries.length}.`);
}

const expected = [
  "acantose", "acne", "celulite", "cicatrizes", "clareamento-facial", "clareamento-corporal",
  "esporotricose", "estrias", "flacidez", "leucodermia", "limpeza-de-pele", "manchas",
  "operatorio", "poros", "rejuvenescimento", "remocoes", "rosacea", "sobrancelha",
  "gordura-localizada", "definicao-corporal", "manchas-solares-em-maos"
];
for (const context of expected) {
  if (!Object.values(config.pageContexts).includes(context)) errors.push(`Contexto esperado ausente: ${context}.`);
}

const expectedModes = {
  acantose: { presential: true, online: "consulta" },
  acne: { presential: true, online: "consulta", requiresPreAttendance: true, consultoria: true },
  celulite: { presential: true, online: false },
  cicatrizes: { presential: true, online: false },
  "clareamento-facial": { presential: true, online: "consulta", requiresPreAttendance: true, consultoria: true },
  "clareamento-corporal": { presential: true, online: "consulta", requiresPreAttendance: true },
  "gordura-localizada": { presential: true, online: false },
  "definicao-corporal": { presential: true, online: false },
  esporotricose: { presential: true, online: false },
  estrias: { presential: true, online: false },
  flacidez: { presential: true, online: false },
  leucodermia: { presential: true, online: false },
  "limpeza-de-pele": { presential: true, online: false },
  manchas: { presential: true, online: "consulta", requiresPreAttendance: true, consultoria: true },
  operatorio: { presential: true, online: false },
  poros: { presential: true, online: "consulta", requiresPreAttendance: true, consultoria: true },
  rejuvenescimento: { presential: true, online: "consulta", requiresPreAttendance: true, consultoria: true },
  remocoes: { presential: true, online: false },
  rosacea: { presential: true, online: "consulta", requiresPreAttendance: true, consultoria: true },
  sobrancelha: { presential: true, online: false },
  "manchas-solares-em-maos": { presential: true, online: false }
};
const botSource = readFileSync("assets/js/bot-triagem.js", "utf8");
for (const context of expected) {
  const hasAlias = (config.aliases?.[context]?.length || 0) > 0;
  if (!hasAlias) errors.push(`Tratamento ${context}: sem aliases no motor.`);
  if (!config.greetings?.[context]) errors.push(`Tratamento ${context}: sem saudação específica.`);
  if (!config.labels?.[context]) errors.push(`Tratamento ${context}: sem label.`);
}
for (const [context, expectedMode] of Object.entries(expectedModes)) {
  const actual = config.treatmentModes[context];
  if (!actual) {
    errors.push(`Modalidade ausente para ${context}.`);
    continue;
  }
  for (const [key, value] of Object.entries(expectedMode)) {
    if (actual[key] !== value) errors.push(`Modalidade de ${context}: ${key} esperado "${value}", obtido "${actual[key]}".`);
  }
}
if (!botSource.includes("AUTO_CONFIG.aliases")) errors.push("Motor não carrega aliases automáticos.");
if (errors.length) {
  console.error("ERROS DE ROTAS DO BOT:");
  errors.forEach((e) => console.error("-", e));
  process.exit(1);
}
console.log(`Rotas do bot: OK — ${tratamentoEntries.length} páginas de tratamento mapeadas.`);
