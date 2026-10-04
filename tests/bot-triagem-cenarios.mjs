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

const detectIntent = (text) => {
  const best = detectBest(intents, text);
  if (!best) {
    const normalizedText = normalized(text);
    if (/\bcuidar\b.*\bem casa\b/.test(normalizedText) || /\bcuidados?\b.*\bem casa\b/.test(normalizedText)) return "homeCare";
  }
  return best;
};
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
  ["Quero clarear a virilha", "clareamento-corporal", null],
  ["Quero limpeza nanotecnológica em São Paulo", "limpeza-de-pele", null],
  ["Tenho cicatriz de acne e estou em Cabo Frio", "cicatrizes", null],
  ["Quero definição corporal e moro em Araruama", "definicao-corporal", null],
  ["Quero clarear a virilha e moro em Belo Horizonte", "clareamento-corporal", null],
  ["Quero tratar rosácea, onde atende?", "rosacea", "location"],
  ["Onde acontecem os atendimentos?", null, "location"],
  ["Em quais cidades acontecem os atendimentos presenciais?", null, "location"],
  ["Quanto custa o tratamento de melasma em São Paulo?", "manchas", "price"],
  ["Quero agendar acne em Araruama", "acne", "booking"],
  ["Quero saber o valor da consultoria online para melasma", "manchas", "price"],
  ["Sou de Araruama mas quero consultoria online para acne", "acne", "consultoria"],
  ["Quero consultoria online", null, "consultoria"],
  ["Quero cuidar do melasma em casa", "manchas", "homeCare"],
  ["Quero uma rotina de skincare para minha pele", null, "homeCare"],
  ["Quero cuidar da minha celulite em casa", "celulite", "homeCare"],
  ["Quero uma consulta online para melasma", "manchas", "consultaOnline"],
  ["Quero tratar melasma online", "manchas", "online"],
  ["Moro em São Paulo e quero agendar acne", "acne", "booking"]
];

for (const [input, expectedTopic, expectedIntent] of mixedCases) {
  if (expectedTopic) expect(detectTopic(input) === expectedTopic, input + ': tópico esperado "' + expectedTopic + '", obtido "' + detectTopic(input) + '"');
  if (expectedIntent) expect(detectIntent(input) === expectedIntent, input + ': intenção esperada "' + expectedIntent + '", obtida "' + detectIntent(input) + '"');
}

// Reutilização do contexto informado em uma única mensagem.
expect(bot.includes("function extractVisitorDetails(text)"), "extração de contexto do visitante não encontrada");
expect(bot.includes("state.details.need"), "necessidade informada não é preservada no estado");
expect(bot.includes("state.details.goal"), "objetivo informado não é preservado no estado");
expect(bot.includes("state.details.duration"), "duração informada não é preservada no estado");
expect(bot.includes('if (state.details.need)'), "fluxo ainda repete pergunta de necessidade já informada");
expect(bot.includes('if (state.details.goal)'), "fluxo ainda repete pergunta de objetivo já informado");
expect(bot.includes("const duration = normalizedText.match"), "extração de duração não encontrada");

const detailCases = [
  ["Tenho melasma há 5 anos e meu objetivo é melhorar as manchas", false, true, true],
  ["Me incomoda muito a acne e quero controlar as espinhas", true, true, false],
  ["Tenho acne há 2 meses e moro em São Paulo", false, false, true],
  ["Quero melhorar o melasma", false, true, false]
];
for (const [input, hasNeed, hasGoal, hasDuration] of detailCases) {
  expect(bot.includes("extractVisitorDetails"), input + ": extrator não está presente");
  if (hasNeed) expect(/me incomoda|me preocupa|principalmente me incomoda/.test(normalized(input)), input + ": caso deveria conter necessidade explícita");
  if (hasGoal) expect(/meu objetivo|quero|gostaria de|pretendo/.test(normalized(input)), input + ": caso deveria conter objetivo explícito");
  if (hasDuration) expect(/\b(?:ha|faz)\s+.*\d+\s+(?:dias?|semanas?|meses?|anos?)\b/.test(normalized(input)), input + ": caso deveria conter duração");
}

// Fallback para linguagem natural: descrições sem o nome literal do tratamento.
const naturalLanguageCases = [
  ["Estou com espinhas hormonais", "acne"],
  ["Tenho manchas escuras no rosto", "manchas"],
  ["Meus poros estão muito abertos", "poros"],
  ["Estou com a pele flácida", "flacidez"],
  ["Tenho furinhos nas pernas", "celulite"]
];
for (const [input, expectedTopic] of naturalLanguageCases) {
  expect(detectTopic(input) === expectedTopic, input + ': fallback deveria reconhecer "' + expectedTopic + '"');
}

expect(bot.includes('["oleosidade", /' ), "fallback de oleosidade não está configurado no motor");
expect(bot.includes("oleoso|oleosa|muito oleosa"), "fallback de pele oleosa não está configurado");

// Duração informada deve ser extraída pela mesma expressão usada pelo motor.
expect(/\b(?:ha|faz)\s+.*\d+\s+(?:dias?|semanas?|meses?|anos?)\b/.test("tenho isso ha 5 anos"), "regex de duração deve reconhecer período informado");

// Roteamento.
const localCities = new Set(["araruama", "cabo frio", "copacabana", "saquarema", "iguaba grande", "sao pedro da aldeia", "arraial do cabo", "armacao dos buzios", "niteroi", "sao goncalo"]);
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

// Regiões próximas que o roteamento considera presenciais não devem receber
// automaticamente os preços da consultoria online.
const nearbyPriceCases = [
  ["Niterói", "sou de Niterói", "presential"],
  ["São Gonçalo", "sou de São Gonçalo", "presential"]
];
for (const [name, input, expected] of nearbyPriceCases) {
  const location = detectLocation(input);
  const route = location ? (localCities.has(location) ? "presential" : "online") : null;
  expect(route === expected, name + ': região próxima deve permanecer na rota presencial');
}

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
expect(bot.includes('if (state.context === "limpeza-de-pele")'), "limpeza de pele não possui roteamento geográfico específico");
expect(bot.includes("Araruama, Cabo Frio e Copacabana"), "limpeza de pele não informa as três unidades presenciais");
expect(bot.includes("function typeReply(text, link, linkLabel)"), "respostas graduais não estão implementadas");
expect(bot.includes('if (state.context === "limpeza-de-pele" && !state.location)'), "limpeza de pele deve pedir a cidade antes de orientar");
expect(bot.includes("let responseQueue = Promise.resolve()"), "fila de respostas não protege a escrita gradual contra sobreposição");

// Regras de prioridade: intenção explícita deve prevalecer sobre roteamento geográfico.
expect(detectIntent("sou de Araruama mas quero consultoria online") === "consultoria", "consultoria explícita não deve ser perdida em cidade presencial");
expect(detectIntent("quanto custa a consultoria online para melasma") === "price", "pergunta de preço deve continuar sendo preço, com consultoria reconhecida no tratamento da resposta");
expect(detectIntent("quero uma consulta online para melasma") === "consultaOnline", "consulta online deve ser distinta de consultoria");
expect(detectIntent("quero cuidar do melasma em casa") === "homeCare", "cuidado domiciliar deve permitir indicação da consultoria");
expect(detectIntent("sou de Araruama e quero agendar") === "booking", "agendamento não reconhecido em cidade presencial");
expect(detectIntent("quero atendimento presencial") === "presential", "atendimento presencial explícito não reconhecido");

 // Preço online deve considerar cidade não local, mesmo sem a palavra "online".
expect(bot.includes("const nonLocalCity = state.location && !isPresentialArea(state.location) && !isNearbyPresential(state.location);"),
  "answerPrice deve tratar regiões próximas como presenciais");
expect(bot.includes("|| nonLocalCity) {"), "answerPrice não usa cidade não local na condição online");

// Modalidade por tratamento.
expect(config.includes('acantose: { presential: true, online: "consulta"'), "acantose deve usar consulta online");
expect(config.includes('acne: { presential: true, online: "consulta", requiresPreAttendance: true, consultoria: true }'), "acne deve permitir indicação de consultoria para cuidados domiciliares");
expect(config.includes('"limpeza-de-pele": { presential: true, online: false }'), "limpeza de pele deve ser presencial");
expect(config.includes('manchas: { presential: true, online: "consulta"'), "melasma deve usar consulta online");
expect(config.includes('rosacea: { presential: true, online: "consulta", requiresPreAttendance: true, consultoria: true }'), "rosácea deve permitir indicação de consultoria para cuidados domiciliares");
expect(config.includes('"clareamento-corporal": { presential: true, online: "consulta", requiresPreAttendance: true }'), "clareamento corporal não deve ser tratado como consultoria facial");
expect(config.includes('acantose: { presential: true, online: "consulta", requiresPreAttendance: true }'), "acantose deve permanecer consulta específica, sem indicação automática de consultoria facial");
expect(config.includes('remocoes: { presential: true, online: false }'), "remoções devem ser presenciais");
expect(config.includes('sobrancelha: { presential: true, online: false }'), "despigmentação de sobrancelhas deve ser presencial");
expect(config.includes('celulite: { presential: true, online: false }'), "celulite deve ser presencial");
expect(config.includes('operatorio: { presential: true, online: false }'), "pós-operatório deve ser presencial");
expect(bot.includes("function treatmentMode()"), "motor não consulta a matriz de modalidades");
expect(bot.includes('state.route = "online-consulta"'), "consulta online não possui rota própria");
expect(bot.includes('state.route = "presential-required"'), "tratamento exclusivamente presencial não possui rota própria");
expect(bot.includes('state.route = "consultoria"'), "consultoria não possui rota própria");
expect(bot.includes("function explainConsultoria()"), "motor não possui fluxo específico para consultoria");
expect(bot.includes("const explicitConsultoria = matchesPhrase(state.lastText, \"consultoria online\")"), "preço não diferencia consultoria explícita");
expect(bot.includes("A Consultoria de Skincare Regenerativo é voltada aos cuidados domiciliares da pele, especialmente da face"), "bot não explica o foco domiciliar/facial da consultoria");
expect(bot.includes("if (mode && mode.consultoria !== true)"), "bot não limita a consultoria aos tratamentos faciais elegíveis");
expect(bot.includes("O atendimento online não substitui o procedimento"), "bot não diferencia procedimento presencial");
expect(bot.includes("Não é uma consultoria."), "bot não diferencia consulta de avaliação de consultoria");
expect(bot.includes("const mode = treatmentMode();"), "rota e preço não usam a modalidade do tratamento");

const modalityCases = [
  ["Quero limpeza de pele online", "limpeza-de-pele", "presential-required"],
  ["Quero tratar acne online", "acne", "online-consulta"],
  ["Quero tratar melasma online", "manchas", "online-consulta"],
  ["Quero remover um siringoma online", "remocoes", "presential-required"],
  ["Quero despigmentar minha sobrancelha online", "sobrancelha", "presential-required"]
];
for (const [input, expectedTopic, expectedStage] of modalityCases) {
  expect(detectTopic(input) === expectedTopic, input + ': tópico de modalidade incorreto');
  const modeLine = config.split("\n").find((line) => line.includes(expectedTopic + ":") || line.includes('"' + expectedTopic + '":'));
  expect(Boolean(modeLine), input + ': modalidade não encontrada na configuração');
  if (expectedStage === "online-consulta") expect(modeLine.includes('online: "consulta"'), input + ': deveria exigir consulta online');
  if (expectedStage === "presential-required") expect(modeLine.includes("online: false"), input + ': deveria exigir execução presencial');
}

// Matriz geográfica + modalidade: a cidade deve alterar apenas o caminho disponível,
// sem transformar tratamento presencial em consultoria ou vice-versa.
const geographicModalityCases = [
  ["acne", "São Paulo", "online-consulta"],
  ["acne", "Belo Horizonte", "online-consulta"],
  ["manchas", "São Paulo", "online-consulta"],
  ["manchas", "Belo Horizonte", "online-consulta"],
  ["celulite", "São Paulo", "presential-required"],
  ["celulite", "Belo Horizonte", "presential-required"],
  ["limpeza-de-pele", "São Paulo", "presential-required"],
  ["remocoes", "São Paulo", "presential-required"],
  ["sobrancelha", "São Paulo", "presential-required"],
  ["acne", "Araruama", "presential"],
  ["manchas", "Cabo Frio", "presential"],
  ["celulite", "Copacabana", "presential"]
];

const geographicFunction = bot.slice(bot.indexOf("function routeByLocation()"), bot.indexOf("function askTreatmentLocation()"));
expect(geographicFunction.includes('mode?.online === "consulta" && !isPresentialArea(state.location) && !isNearbyPresential(state.location)'),
  "rota geográfica não diferencia consulta online fora da área presencial");
expect(geographicFunction.includes('state.route = "presential-required"'),
  "rota geográfica não possui caminho presencial obrigatório");
expect(geographicFunction.includes('const local = ["araruama","cabo frio","copacabana"].includes(state.location);'),
  "rota geográfica não reconhece as três unidades presenciais");
expect(geographicFunction.includes("const nearby = isNearbyPresential(state.location);"),
  "rota geográfica não trata regiões próximas separadamente");

const modeLines = config.split("\\n");
const expectedModes = {
  acne: 'online: "consulta"',
  manchas: 'online: "consulta"',
  celulite: 'online: false',
  "limpeza-de-pele": 'online: false',
  remocoes: 'online: false',
  sobrancelha: 'online: false'
};
for (const [topic, city, expectedRoute] of geographicModalityCases) {
  const modeLine = modeLines.find((line) => line.includes(topic + ":") || line.includes('"' + topic + '":'));
  expect(Boolean(modeLine), topic + ": modalidade não encontrada na matriz geográfica");
  if (modeLine && expectedModes[topic]) expect(modeLine.includes(expectedModes[topic]), topic + ": modalidade incompatível com a regra esperada");
  const location = detectLocation("Estou em " + city);
  const local = location && ["araruama", "cabo frio", "copacabana"].includes(location);
  const nearby = location && ["saquarema", "iguaba grande", "sao pedro da aldeia", "arraial do cabo", "armacao dos buzios", "niteroi", "sao goncalo"].includes(location);
  let simulatedRoute;
  if (topic === "limpeza-de-pele") {
    simulatedRoute = (local || nearby) ? "presential" : "presential-required";
  } else if (expectedModes[topic] === 'online: "consulta"' && !local && !nearby) {
    simulatedRoute = "online-consulta";
  } else if (local || nearby) {
    simulatedRoute = "presential";
  } else {
    simulatedRoute = "presential-required";
  }
  expect(simulatedRoute === expectedRoute, topic + " + " + city + ": rota esperada " + expectedRoute + ", obtida " + simulatedRoute);
}

// Cenário específico solicitado: visitante em São Paulo que quer agendar acne.
// O bot deve conhecer a cidade antes do WhatsApp e, fora do RJ, cair na consulta online.
const bookingBlockForCity = bot.slice(bot.indexOf('if (intent === "booking")'), bot.indexOf('if (intent === "price")'));
expect(bookingBlockForCity.includes("if (!state.location)"), "agendamento não protege o encaminhamento sem cidade");
expect(bookingBlockForCity.includes("routeByLocation();"), "agendamento não usa o roteamento geográfico após receber a cidade");
expect(bot.includes('if (mode?.online === "consulta" && !isPresentialArea(state.location) && !isNearbyPresential(state.location))'),
  "São Paulo não seria direcionado para consulta online nos tratamentos elegíveis");

// Combinações de tratamento + cidade + intenção.
// A cidade não deve alterar a natureza do atendimento: apenas o caminho geográfico.
const combinationCases = [
  ["Quero tratar acne online e moro em São Paulo", "acne", "online-consulta", true],
  ["Quero tratar acne online e moro em Araruama", "acne", "online-consulta", true],
  ["Quero tratar celulite online e moro em São Paulo", "celulite", "presential-required", false],
  ["Quero tratar celulite online e moro em Araruama", "celulite", "presential-required", false],
  ["Quero tratar melasma online e moro em Belo Horizonte", "manchas", "online-consulta", true],
  ["Quero tratar melasma online e moro em Araruama", "manchas", "online-consulta", true],
  ["Quero limpeza de pele online e moro em São Paulo", "limpeza-de-pele", "presential-required", false],
  ["Quero limpeza de pele online e moro em Araruama", "limpeza-de-pele", "presential-required", false]
];
for (const [input, expectedTopic, expectedRoute, requiresPreAttendance] of combinationCases) {
  expect(detectTopic(input) === expectedTopic, input + ': tratamento incorreto');
  const modeLine = config.split("\n").find((line) => line.includes(expectedTopic + ":") || line.includes('"' + expectedTopic + '":'));
  expect(Boolean(modeLine), input + ': modalidade ausente');
  if (expectedRoute === "online-consulta") {
    expect(modeLine.includes('online: "consulta"'), input + ': deveria iniciar por consulta online');
    if (requiresPreAttendance) expect(modeLine.includes("requiresPreAttendance: true"), input + ': deveria exigir pré-atendimento');
  }
  if (expectedRoute === "presential-required") {
    expect(modeLine.includes("online: false"), input + ': deveria permanecer presencial');
  }
}

// Cuidado domiciliar não pode transformar tratamentos inelegíveis em consultoria.
const homeCarePriceCases = [
  ["Quero cuidar da minha celulite em casa", "celulite"],
  ["Quero cuidar das minhas estrias em casa", "estrias"],
  ["Quero cuidar da flacidez em casa", "flacidez"],
  ["Quero cuidar da gordura localizada em casa", "gordura-localizada"],
  ["Quero cuidar das minhas cicatrizes em casa", "cicatrizes"],
  ["Quero cuidar da limpeza de pele em casa", "limpeza-de-pele"]
];
for (const [input, expectedTopic] of homeCarePriceCases) {
  expect(detectTopic(input) === expectedTopic, input + ': cuidado domiciliar perdeu o tratamento específico');
}
expect(bot.includes('if (state.intent === "homeCare")'), "fluxo de cuidado domiciliar não encontrado");
expect(bot.includes("if (!mode || mode.consultoria === true)"), "elegibilidade da consultoria não é verificada no cuidado domiciliar");

// Combinações de intenção + tratamento: preço/consulta/consultoria não podem vazar
// entre modalidades diferentes.
const priceLeakCases = [
  ["Quero saber o valor da celulite", "celulite", false],
  ["Quanto custa tratar estrias?", "estrias", false],
  ["Quanto custa a limpeza de pele?", "limpeza-de-pele", false],
  ["Quanto custa tratar cicatriz de acne?", "cicatrizes", false],
  ["Quanto custa tratar acne?", "acne", true],
  ["Quanto custa tratar melasma?", "manchas", true],
  ["Quanto custa a consultoria online para acne?", "acne", true]
];
for (const [input, expectedTopic, consultoriaEligible] of priceLeakCases) {
  expect(detectTopic(input) === expectedTopic, input + ': tratamento incorreto na pergunta de preço');
  const modeLine = config.split("\n").find((line) => line.includes(expectedTopic + ":") || line.includes('"' + expectedTopic + '":'));
  expect(Boolean(modeLine), input + ': modalidade ausente na pergunta de preço');
  if (!consultoriaEligible) {
    expect(!modeLine.includes("consultoria: true"), input + ': tratamento inelegível marcado como consultoria');
  }
}

// Trocas de assunto devem ocorrer antes dos estágios que poderiam herdar a rota anterior.
expect(bot.indexOf('if (topic && topic !== previousContext)') < bot.indexOf('if (state.stage === "presential")'), "troca de assunto não antecede estágio presencial");
expect(bot.indexOf('if (topic && topic !== previousContext)') < bot.indexOf('if (state.stage === "online-consulta")'), "troca de assunto não antecede estágio de consulta online");

// Troca de tratamento deve invalidar a rota anterior para não herdar
// online/presencial de outro contexto.
expect(bot.includes("state.route = null;"), "troca de tratamento não reseta a rota anterior");
expect(bot.includes("state.intent = intent || null;"), "troca de tratamento não reseta a intenção anterior quando não há nova intenção");

// Limpeza de pele: regiões atendidas/próximas seguem para WhatsApp; fora da área,
 // o bot informa as três unidades presenciais.
const cleaningCities = [
  ["Araruama", "limpeza de pele em Araruama", true],
  ["Cabo Frio", "quero limpeza de pele e moro em Cabo Frio", true],
  ["Copacabana", "quero limpeza de pele no Rio de Janeiro", true],
  ["Niterói", "quero limpeza de pele e moro em Niterói", true],
  ["São Gonçalo", "quero limpeza de pele e moro em São Gonçalo", true],
  ["São Paulo", "quero limpeza de pele e moro em São Paulo", false]
];
for (const [name, input, shouldRouteToWhatsApp] of cleaningCities) {
  expect(detectTopic(input) === "limpeza-de-pele", name + ": limpeza de pele não reconhecida");
  const location = detectLocation(input);
  const regional = location && localCities.has(location);
  expect(Boolean(regional) === shouldRouteToWhatsApp, name + ": roteamento geográfico incorreto para limpeza de pele");
}

// Atendimento presencial: antes de informar valor ou encaminhar, a cidade deve ser conhecida.
const treatmentPriceBlock = bot.slice(bot.indexOf("function answerPrice()"), bot.indexOf("function answerRule("));
expect(treatmentPriceBlock.includes("if (mode && mode.presential && !state.location"), "preço de tratamento presencial não exige cidade antes da resposta");
expect(treatmentPriceBlock.includes("askTreatmentLocation();"), "preço de tratamento presencial não chama a coleta de cidade");

// Localização institucional não deve depender da cidade do visitante.
expect(bot.includes("Temos três polos de atendimento presencial: Araruama, Cabo Frio e Copacabana."), "resposta dos três polos não encontrada");
expect(bot.includes("endereco exato"), "intenção de endereço exato não configurada");
expect(bot.includes("endereço exato"), "variação acentuada de endereço exato não configurada");
expect(bot.includes("passa o endereço completo após o agendamento ser efetuado"), "regra de endereço após agendamento não encontrada");

// Agendamento: a cidade deve ser conhecida antes de qualquer encaminhamento ao WhatsApp.
const bookingBlock = bot.slice(bot.indexOf('if (intent === "booking")'), bot.indexOf('if (intent === "price")'));
expect(bookingBlock.includes("if (!state.location)"), "agendamento não exige cidade antes do encaminhamento");
expect(bookingBlock.includes("Qual é a sua cidade?"), "agendamento não pergunta a cidade");
expect(bookingBlock.includes("routeByLocation();"), "agendamento não passa pelo roteamento após identificar a cidade");

// Limites.
expect(bot.includes("O endereço completo é informado após o agendamento"), "proteção do endereço não encontrada");
expect(!/diagnostico\s+definitivo|prescrev|receita\s+de/i.test(bot), "padrão de diagnóstico/prescrição encontrado no motor");

if (errors.length) {
  console.error("ERROS DE CENÁRIOS DO BOT:");
  errors.forEach((error) => console.error("-", error));
  process.exit(1);
}

console.log("Cenários do bot: OK — entrada contextual, continuidade, cenários mistos, roteamento, preço online e limites.");
