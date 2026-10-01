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

if (errors.length) {
  console.error("ERROS DE ROTAS DO BOT:");
  errors.forEach((e) => console.error("-", e));
  process.exit(1);
}

console.log(`Rotas do bot: OK — ${tratamentoEntries.length} páginas de tratamento mapeadas.`);
