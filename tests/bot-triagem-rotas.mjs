import { existsSync, readFileSync } from "node:fs";
import vm from "node:vm";

const configSource = readFileSync("assets/js/bot-config.js", "utf8");
const sandbox = { window: {} };
vm.runInNewContext(configSource, sandbox);
const config = sandbox.window.ESPECIALISTA_PELE_BOT_CONFIG;
if (!config) throw new Error("bot-config.js não expôs ESPECIALISTA_PELE_BOT_CONFIG.");

const tratamentoEntries = Object.entries(config.pageContexts)
  .filter(([path]) => path.startsWith("/tratamentos/"));

const errors = [];
for (const [route, context] of tratamentoEntries) {
  const file = route.replace(/^\//, "");
  if (!existsSync(file)) errors.push(`Rota ${route}: arquivo inexistente (${file}).`);
  if (!context) errors.push(`Rota ${route}: contexto vazio.`);
}

if (tratamentoEntries.length !== 20) {
  errors.push(`Esperados 20 contextos de tratamento; encontrados ${tratamentoEntries.length}.`);
}

const expected = [
  "acantose","acne","celulite","cicatrizes","clareamento-facial","clareamento-corporal",
  "esporotricose","estrias","flacidez","leucodermia","limpeza-de-pele","manchas",
  "operatorio","poros","rejuvenescimento","remocoes","rosacea","sobrancelha",
  "gordura-localizada","definicao-corporal"
];
for (const context of expected) {
  if (!Object.values(config.pageContexts).includes(context)) {
    errors.push(`Contexto esperado ausente: ${context}.`);
  }
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
  sobrancelha: { presential: true, online: false }
};

// Cada tratamento publicado precisa existir também no motor de linguagem e na apresentação.
// Isso evita página sem contexto reconhecível, saudação ou label.
const botSource = readFileSync("assets/js/bot-triagem.js", "utf8");
const greetingSource = config.greetings || {};
const labelSource = config.labels || {};

for (const context of expected) {
  const aliasNeedle = context.includes("-") ? `"${context}":` : `${context}:`;
  if (!botSource.includes(aliasNeedle)) errors.push(`Tratamento ${context}: sem aliases no motor.`);
  if (!greetingSource[context]) errors.push(`Tratamento ${context}: sem saudação específica.`);
  if (!labelSource[context]) errors.push(`Tratamento ${context}: sem label.`);
}

for (const [context, expectedMode] of Object.entries(expectedModes)) {
  const actual = config.treatmentModes[context];
  if (!actual) {
    errors.push(`Modalidade ausente para ${context}.`);
    continue;
  }
  for (const [key, value] of Object.entries(expectedMode)) {
    if (actual[key] !== value) {
      errors.push(`Modalidade de ${context}: ${key} esperado "${value}", obtido "${actual[key]}".`);
    }
  }
}

if (errors.length) {
  console.error("ERROS DE ROTAS DO BOT:");
  errors.forEach((e) => console.error("-", e));
  process.exit(1);
}

console.log(`Rotas do bot: OK — ${tratamentoEntries.length} páginas de tratamento mapeadas.`);
