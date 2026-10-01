import { readFileSync } from "node:fs";

const source = readFileSync("assets/js/bot-triagem.js", "utf8");
const aliasesBlock = source.match(/const aliases = \{([\s\S]*?)\n  \};/)?.[1];
if (!aliasesBlock) throw new Error("Não foi possível localizar aliases no bot.");

const aliases = {};
for (const line of aliasesBlock.split("\n")) {
  const match = line.match(/^\s*"?([^":]+)"?\s*:\s*\[(.*)\],?$/);
  if (!match) continue;
  aliases[match[1]] = [...match[2].matchAll(/"([^"]*)"/g)].map((m) => m[1]);
}

const normalize = (value) => String(value || "")
  .toLowerCase()
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9\s-]/g, " ")
  .replace(/\s+/g, " ").trim();

function detectTopic(text) {
  const n = normalize(text);
  let best = null;
  let bestLength = 0;
  for (const [topic, words] of Object.entries(aliases)) {
    for (const word of words) {
      const phrase = normalize(word);
      if (phrase && n.includes(phrase) && phrase.length > bestLength) {
        best = topic;
        bestLength = phrase.length;
      }
    }
  }
  return best;
}

const cases = [
  ["Acantose", "Tenho acantose nigricans no pescoço", "acantose"],
  ["Acne", "Tenho acne e espinhas", "acne"],
  ["Celulite", "Quero tratar celulite", "celulite"],
  ["Cicatrizes de acne", "Tenho cicatriz de acne", "cicatrizes"],
  ["Clareamento facial", "Quero clareamento facial", "clareamento-facial"],
  ["Clareamento corporal", "Quero clarear a virilha", "clareamento-corporal"],
  ["Redução de gordura localizada", "Tenho gordura localizada abdominal", "gordura-localizada"],
  ["Definição corporal", "Quero definição corporal", "definicao-corporal"],
  ["Esporotricose", "Tenho cicatrizes por esporotricose", "esporotricose"],
  ["Estrias", "Quero tratar estrias", "estrias"],
  ["Flacidez", "Tenho flacidez", "flacidez"],
  ["Leucodermia solar", "Tenho leucodermia solar", "leucodermia"],
  ["Limpeza nanotecnológica", "Quero limpeza nanotecnológica", "limpeza-de-pele"],
  ["Melasma", "Tenho melasma", "manchas"],
  ["Pós-operatório", "Estou no pós-operatório", "operatorio"],
  ["Poros", "Tenho poros dilatados", "poros"],
  ["Rejuvenescimento facial", "Quero rejuvenescimento facial", "rejuvenescimento"],
  ["Remoções", "Quero remover um sinal", "remocoes"],
  ["Rosácea", "Tenho rosácea", "rosacea"],
  ["Despigmentação de sobrancelhas", "Quero tirar a micropigmentação da sobrancelha", "sobrancelha"]
];

const errors = [];
for (const [name, input, expected] of cases) {
  const got = detectTopic(input);
  if (got !== expected) errors.push(`${name}: esperado "${expected}", obtido "${got}".`);
}

if (errors.length) {
  console.error("ERROS DE COMPORTAMENTO DO BOT:");
  errors.forEach((e) => console.error("-", e));
  process.exit(1);
}

console.log(`Comportamento do bot: OK — ${cases.length}/${cases.length} cenários de tratamento.`);
