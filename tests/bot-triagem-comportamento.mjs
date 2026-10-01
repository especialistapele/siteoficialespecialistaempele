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
  let best = null;
  let bestLength = 0;
  for (const [topic, words] of Object.entries(aliases)) {
    for (const word of words) {
      const phrase = normalize(word);
      if (phrase && matchesPhrase(text, phrase) && phrase.length > bestLength) {
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
const intentsBlock = source.match(/const intents = \{([\s\S]*?)\n  \};/)?.[1];
if (!intentsBlock) throw new Error("Não foi possível localizar intents no bot.");

const intents = {};
for (const line of intentsBlock.split("\n")) {
  const match = line.match(/^\s*"?([^":]+)"?\s*:\s*\[(.*)\],?$/);
  if (!match) continue;
  intents[match[1]] = [...match[2].matchAll(/"([^"]*)"/g)].map((m) => m[1]);
}

function matchesPhrase(text, phrase) {
  const value = normalize(text).split(" ").filter(Boolean);
  const target = normalize(phrase).split(" ").filter(Boolean);
  if (!value.length || !target.length || target.length > value.length) return false;
  for (let i = 0; i <= value.length - target.length; i++) {
    let matches = true;
    for (let j = 0; j < target.length; j++) {
      if (value[i + j] !== target[j]) {
        matches = false;
        break;
      }
    }
    if (matches) return true;
  }
  return false;
}

function detectIntent(text) {
  let best = null;
  let bestLength = 0;
  for (const [intent, words] of Object.entries(intents)) {
    for (const word of words) {
      const phrase = normalize(word);
      if (phrase && matchesPhrase(text, phrase) && phrase.length > bestLength) {
        best = intent;
        bestLength = phrase.length;
      }
    }
  }
  return best;
}

const intentCases = [
  ["Taxa específica", "quanto custa a taxa?", "appointmentFee"],
  ["Preço genérico", "quanto custa?", "price"],
  ["Agendamento", "quero agendar minha consulta", "booking"],
  ["Paciente", "já sou paciente e quero acessar meu painel", "patient"],
  ["Reagendamento", "preciso remarcar", "reschedule"],
  ["Atraso", "qual a tolerância de atraso?", "delay"],
  ["Reembolso", "quero saber sobre reembolso", "refund"],
  ["Endereço", "qual o endereço?", "address"],
  ["Local", "onde atende?", "location"],
  ["Online", "quero consultoria online", "online"]
];

for (const [name, input, expected] of intentCases) {
  const got = detectIntent(input);
  if (got !== expected) errors.push(`${name}: esperado "${expected}", obtido "${got}".`);
}

const falsePositiveCases = [
  ["taxa dentro de palavra", "taxativo", null],
  ["local dentro de palavra", "localidade", null],
  ["valor dentro de palavra", "valorização", null]
];

const locationCases = [
  ["Araruama", "moro em Araruama", "araruama"],
  ["Fazendinha", "sou da Fazendinha", "araruama"],
  ["Cabo Frio", "estou em Cabo Frio", "cabo frio"],
  ["Rio de Janeiro", "moro no Rio de Janeiro", "copacabana"],
  ["São Paulo", "sou de São Paulo", "sao paulo"],
  ["Belo Horizonte", "moro em Belo Horizonte", "belo horizonte"],
  ["Niterói", "sou de Niterói", "niteroi"],
  ["cidade dentro de palavra", "araruamense", null],
  ["cidade dentro de palavra", "paulistano", null]
];

function detectLocation(text) {
  const locations = [
    ["araruama", ["araruama", "fazendinha"]],
    ["cabo frio", ["cabo frio", "riviera"]],
    ["copacabana", ["copacabana", "siqueira campos", "rio de janeiro"]],
    ["sao paulo", ["sao paulo"]],
    ["curitiba", ["curitiba"]],
    ["belo horizonte", ["belo horizonte"]],
    ["vitoria", ["vitoria"]],
    ["brasilia", ["brasilia"]],
    ["salvador", ["salvador"]],
    ["niteroi", ["niteroi"]],
    ["petropolis", ["petropolis"]],
    ["marica", ["marica"]],
    ["macae", ["macae"]]
  ];

  let best = null;
  let bestLength = 0;
  for (const [location, phrases] of locations) {
    for (const phrase of phrases) {
      if (matchesPhrase(text, phrase) && phrase.length > bestLength) {
        best = location;
        bestLength = phrase.length;
      }
    }
  }
  return best;
}

for (const [name, input, expected] of locationCases) {
  const got = detectLocation(input);
  if (got !== expected) errors.push(`${name}: esperado "${expected}", obtido "${got}".`);
}

for (const [name, input, expected] of falsePositiveCases) {
  const got = detectIntent(input);
  if (got !== expected) errors.push(`${name}: esperado "${expected}", obtido "${got}".`);
}

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
