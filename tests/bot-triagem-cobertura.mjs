import { existsSync, readFileSync } from "node:fs";
import vm from "node:vm";

const configSource = readFileSync("assets/js/bot-config.js", "utf8");
const sandbox = { window: {} };
vm.runInNewContext(configSource, sandbox);
const config = sandbox.window.ESPECIALISTA_PELE_BOT_CONFIG;

const bot = readFileSync("assets/js/bot-triagem.js", "utf8");
const whatsapp = readFileSync("assets/js/whatsapp.js", "utf8");
const errors = [];

for (const [route, context] of Object.entries(config.pageContexts)) {
  if (!route.startsWith("/tratamentos/")) continue;

  const file = route.slice(1);
  const html = readFileSync(file, "utf8");

  if (!html.includes('data-whatsapp-link')) {
    errors.push(`${file}: não possui data-whatsapp-link.`);
  }
  if (!whatsapp.includes('assets/css/bot-triagem.css') || !whatsapp.includes('assets/js/bot-triagem.js')) {
    errors.push("whatsapp.js: carregamento do CSS/engine do bot não encontrado.");
    break;
  }
  if (!(context in config.greetings)) errors.push(`${file}: greeting ausente para contexto "${context}".`);
  if (!(context in config.labels)) errors.push(`${file}: label ausente para contexto "${context}".`);
}

if (!/function detectTopic\(text\)/.test(bot)) {
  errors.push("bot-triagem.js: detectTopic não encontrado.");
}
if (!/bestLength/.test(bot)) {
  errors.push("bot-triagem.js: seleção do tópico específico mais longo não encontrada.");
}

const requiredPhrases = [
  "acantose nigricans",
  "gordura localizada",
  "clarear a virilha",
  "despigmentação de sobrancelha",
  "leucodermia solar",
  "esporotricose",
  "limpeza nanotecnológica",
  "definição corporal"
];
for (const phrase of requiredPhrases) {
  if (!bot.normalize ? false : false) {}
  if (!bot.includes(phrase)) {
    errors.push(`bot-triagem.js: termo específico ausente: "${phrase}".`);
  }
}

if (errors.length) {
  console.error("ERROS DE COBERTURA DO BOT:");
  errors.forEach((e) => console.error("-", e));
  process.exit(1);
}

console.log("Cobertura do bot: OK — páginas, integrações, greetings, labels e termos específicos validados.");
