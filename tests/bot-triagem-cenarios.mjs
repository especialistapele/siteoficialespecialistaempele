import { readFileSync } from "node:fs";

const bot = readFileSync("assets/js/bot-triagem.js", "utf8");
const config = readFileSync("assets/js/bot-config.js", "utf8");
const errors = [];
const expect = (condition, message) => { if (!condition) errors.push(message); };

const normalized = (value) => String(value || "")
  .toLowerCase()
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9\s-]/g, " ")
  .replace(/\s+/g, " ").trim();

const phrase = (text, target) => {
  const a = normalized(text).split(" ").filter(Boolean);
  const b = normalized(target).split(" ").filter(Boolean);
  if (!a.length || !b.length || b.length > a.length) return false;
  for (let i = 0; i <= a.length - b.length; i++) {
    if (b.every((token, j) => a[i + j] === token)) return true;
  }
  return false;
};

function parseMap(block) {
  const map = {};
  for (const line of block.split("\n")) {
    const match = line.match(/^\s*"?([^":]+)"?\s*:\s*\[(.*)\],?$/);
    if (!match) continue;
    map[match[1]] = [...match[2].matchAll(/"([^"]*)"/g)].map((m) => m[1]);
  }
  return map;
}

const intentsBlock = bot.match(/const intents = \{([\s\S]*?)\n  \};/)?.[1] || "";
const aliasesBlock = bot.match(/const aliases = \{([\s\S]*?)\n  \};/)?.[1] || "";
const intents = parseMap(intentsBlock);
const aliases = parseMap(aliasesBlock);

function detectBest(map, text) {
  let best = null;
  let bestLength = 0;
  for (const [key, words] of Object.entries(map)) {
    for (const word of words) {
      const length = normalized(word).length;
      if (phrase(text, word) && length > bestLength) {
        best = key;
        bestLength = length;
      }
    }
  }
  return best;
}

const detectIntent = (text) => detectBest(intents, text);
const detectTopic = (text) => detectBest(aliases, text);

const cityPhrases = [
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
  ["macae", ["macae"]],
  ["saquarema", ["saquarema"]],
  ["iguaba grande", ["iguaba grande"]],
  ["sao pedro da aldeia", ["sao pedro da aldeia"]],
  ["arraial do cabo", ["arraial do cabo"]],
  ["armacao dos buzios", ["armacao dos buzios", "buzios"]],
  ["sao goncalo", ["sao goncalo"]]
];

function detectLocation(text) {
  let best = null;
  let bestLength = 0;
  for (const [location, words] of cityPhrases) {
    for (const word of words) {
      const length = normalized(word).length;
      if (phrase(text, word) && length > bestLength) {
        best = location;
        bestLength = length;
      }
    }
  }
  return best;
}

// Entrada contextual: os contextos publicados precisam ter label e saudação.
const contextBlock = config.match(/pageContexts:\s*\{([\s\S]*?)\n  \},\n  greetings:/)?.[1] || "";
const greetingBlock = config.match(/greetings:\s*\{([\s\S]*?)\n  \},\n  labels:/)?.[1] || "";
const labelBlock = config.match(/labels:\s*\{([\s\S]*?)\n  \}\n\};/)?.[1] || "";
const contexts = [...contextBlock.matchAll(/"([^"]+)"\s*:\s*"([^"]+)"/g)].map((m) => m[2]);
const greetingKeys = new Set([...greetingBlock.matchAll(/(?:^|\n)\s*"?([^":]+)"?\s*:/g)].map((m) => m[1].trim()));
const labelKeys = new Set([...labelBlock.matchAll(/(?:^|\n)\s*"?([^":]+)"?\s*:/g)].map((m) => m[1].trim()));

for (const context of contexts.filter((value) => value !== "home")) {
  expect(greetingKeys.has(context), 'contexto "' + context + '" sem saudação específica');
  expect(labelKeys.has(context), 'contexto "' + context + '" sem label para o teaser');
}

expect(bot.includes("sessionStorage.setItem(STORAGE_KEY"), "persistência da sessão não encontrada");
expect(bot.includes("state.context = pageContext"), "troca de contexto entre páginas não encontrada");
expect(bot.includes('if (saved.lastPath !== path) {'), "retorno para home não ressincroniza o contexto da página");
expect(bot.includes('state.stage = pageContext === "home" ? "understand" : "explore";'), "retorno para home não ressincroniza o estágio");
expect(bot.includes("const previousContext = state.context"), "troca de tratamento durante o fluxo não registra contexto anterior");
expect(bot.includes('if (topic && topic !== previousContext)'), "troca de tratamento durante o fluxo não interrompe o estágio anterior");
expect(bot.indexOf('if (topic && topic !== previousContext)') < bot.indexOf('if (state.stage === "presential")'), "troca de tratamento deve ocorrer antes do estágio presencial");
expect(bot.indexOf('if (topic && topic !== previousContext)') < bot.indexOf('if (state.stage === "online")'), "troca de tratamento deve ocorrer antes do estágio online");
expect(bot.includes("transcript = Array.isArray(saved.transcript)"), "restauração do histórico não encontrada");
expect(bot.includes("conversationId = data.id;"), "conversationId não é preservado após criação");
expect(bot.includes('sessionStorage.setItem("ep-bot-teaser:" + path, "1")'), "teaser não está protegido contra repetição na mesma página");
expect(bot.includes('els.teaserAction.addEventListener("click", openAssistant)'), "ação do teaser não abre o assistente");
expect(bot.includes("const teaserTimer = window.setTimeout(showContextualTeaser, 4500)"), "gatilho temporal do teaser não encontrado");

// Cenários mistos.
const mixedCases = [
  ["Tenho acne e quero agendar", "acne", "booking"],
  ["Quanto custa o tratamento de melasma?", "manchas", "price"],
  ["Moro em Araruama e quero saber sobre acne", "acne", null],
  ["Sou de São Paulo, quanto custa a consultoria?", null, "price"],
  ["Quero clarear a virilha", "clareamento-corporal", null]
];

for (const [input, expectedTopic, expectedIntent] of mixedCases) {
  if (expectedTopic) expect(detectTopic(input) === expectedTopic, input + ': tópico esperado "' + expectedTopic + '", obtido "' + detectTopic(input) + '"');
  if (expectedIntent) expect(detectIntent(input) === expectedIntent, input + ': intenção esperada "' + expectedIntent + '", obtida "' + detectIntent(input) + '"');
}

// Roteamento.
const localCities = new Set(["araruama", "cabo frio", "copacabana", "saquarema", "iguaba grande", "sao pedro da aldeia", "arraial do cabo", "armacao dos buzios", "sao goncalo"]);
const routeCases = [
  ["Araruama", "moro em Araruama", "presential"],
  ["Cabo Frio", "estou em Cabo Frio", "presential"],
  ["Copacabana", "moro no Rio de Janeiro", "presential"],
  ["São Paulo", "sou de São Paulo", "online"],
  ["Belo Horizonte", "moro em Belo Horizonte", "online"],
  ["Saquarema", "moro em Saquarema", "presential"],
  ["Iguaba Grande", "sou de Iguaba Grande", "presential"],
  ["São Pedro da Aldeia", "estou em São Pedro da Aldeia", "presential"],
  ["Arraial do Cabo", "moro em Arraial do Cabo", "presential"],
  ["Búzios", "sou de Búzios", "presential"],
  ["São Gonçalo", "estou em São Gonçalo", "presential"]
];

for (const [name, input, expected] of routeCases) {
  const location = detectLocation(input);
  const route = location ? (localCities.has(location) ? "presential" : "online") : null;
  expect(route === expected, name + ': rota esperada "' + expected + '", obtida "' + route + '"');
}

// Atendimento presencial explícito e regiões próximas devem permanecer presenciais.
expect(detectIntent("quero atendimento presencial") === "presential", "intenção de atendimento presencial não reconhecida");
expect(bot.includes("CONFIG.routes.preAttendance"), "rota de pré-atendimento não utilizada pelo fluxo presencial");
expect(bot.includes("Preencher pré-atendimento →"), "CTA do pré-atendimento não encontrado");
expect(bot.includes("function isNearbyPresential"), "regiões próximas não estão configuradas como atendimento presencial");

// Preço online deve considerar cidade não local, mesmo sem a palavra "online".
expect(bot.includes('const nonLocalCity = state.location && !["araruama","cabo frio","copacabana"].includes(state.location);'),
  "answerPrice não considera cidade não local");
expect(bot.includes("|| nonLocalCity) {"), "answerPrice não usa cidade não local na condição online");

// Limites.
expect(bot.includes("O endereço completo é informado após o agendamento"), "proteção do endereço não encontrada");
expect(!/diagnostico\s+definitivo|prescrev|receita\s+de/i.test(bot), "padrão de diagnóstico/prescrição encontrado no motor");

if (errors.length) {
  console.error("ERROS DE CENÁRIOS DO BOT:");
  errors.forEach((error) => console.error("-", error));
  process.exit(1);
}

console.log("Cenários do bot: OK — entrada contextual, continuidade, cenários mistos, roteamento, preço online e limites.");
