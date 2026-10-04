/* Bot de Triagem — motor determinístico, sem IA */
(function () {
  "use strict";

  const BASE_CONFIG = window.ESPECIALISTA_PELE_BOT_CONFIG;
  const AUTO_CONFIG = window.ESPECIALISTA_PELE_BOT_AUTO || {};
  if (!BASE_CONFIG) return;

  // O instalador automático pode acrescentar tratamentos publicados sem
  // sobrescrever as regras manuais já existentes no bot.
  const CONFIG = BASE_CONFIG;
  for (const section of ["treatmentModes", "pageContexts", "greetings", "labels"]) {
    if (AUTO_CONFIG[section] && typeof AUTO_CONFIG[section] === "object") {
      CONFIG[section] = { ...(AUTO_CONFIG[section] || {}), ...(CONFIG[section] || {}) };
    }
  }

  // Registro das conversas: o motor continua determinístico e o histórico
  // é persistido separadamente no Supabase para consulta exclusiva do admin.
  let supabaseClient = null;
  let conversationId = null;
  let conversationPromise = null;
  let sessionId = null;

  async function getSupabaseClient() {
    if (supabaseClient) return supabaseClient;
    try {
      const mod = await import("/painel/assets/js/painel-auth.js");
      supabaseClient = mod.supabase;
      return supabaseClient;
    } catch (error) {
      console.warn("[Bot] Histórico indisponível:", error);
      return null;
    }
  }

  function getSessionId() {
    if (sessionId) return sessionId;
    try {
      sessionId = crypto.randomUUID();
    } catch {
      sessionId = "sess-" + Date.now() + "-" + Math.random().toString(36).slice(2);
    }
    return sessionId;
  }

  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const excluded = [/^\/painel(?:\/|$)/, /^\/pre-atendimento(?:\/|$)/, /^\/privacidade\.html$/, /^\/cookies\.html$/];
  if (excluded.some((rx) => rx.test(path))) return;

  const normalize = (value) => String(value || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ").trim();

  const aliases = {
    acne:["acne","espinha","espinhas","cravo","cravos","espinhas hormonais","acne hormonal"],
    manchas:["mancha","manchas","melasma","pigmentacao","manchas escuras","pele manchada"],
    cicatrizes:["cicatriz","cicatrizes","marca de acne","marcas de acne"],
    rosacea:["rosacea","vermelhidao","vermelhida"],
    rejuvenescimento:["rejuvenescimento","rugas","linhas","flacidez facial","envelhecimento"],
    poros:["poro","poros","poro dilatado","poros dilatados","poros aparentes","poros muito abertos"],
    nanotecnologia:["nanotecnologia"],
    clareamento:["clareamento","virilha","coxas","axila","gluteos"],
    remocoes:["remocao","remover","sinal","sinais","verruga","nevo","nigras","milium","xantelasma","siringoma"],
    corporal:["corporal"],
    operatorio:["operatorio","pos operatorio","pos-operatorio"],
    sobrancelha:["sobrancelha","sobrancelhas","despigmentacao de sobrancelha","despigmentação de sobrancelha","tirar a micropigmentacao","tirar a micropigmentação","sobrancelha manchada"],
    "clareamento-facial":["clareamento facial","clarear o rosto","manchas no rosto"],
    "clareamento-corporal":["clareamento corporal","clarear virilha","clarear a virilha","clarear axila","clarear a axila","clarear coxas","clarear as coxas","clarear gluteos","clarear os gluteos"],
    "limpeza-de-pele":["limpeza de pele","limpeza nanotecnologica"],
    celulite:["celulite","furinhos nas pernas","furinhos no bumbum","pele com furinhos"],
    estrias:["estria","estrias"],
    flacidez:["flacidez","pele flacida","pele frouxa"],
    esporotricose:["esporotricose","cicatriz de esporotricose","cicatrizes por esporotricose"],
    leucodermia:["leucodermia","leucodermia solar"],
    acantose:["acantose","acantose nigricans","pescoco escuro","pescoço escuro","pele escura nas dobras"],
    "gordura-localizada":["gordura localizada","gordura abdominal","gordura"],
    "definicao-corporal":["definicao corporal","definição corporal","definicao"]
  };

  // Aliases gerados automaticamente para novos tratamentos publicados.
  if (AUTO_CONFIG.aliases && typeof AUTO_CONFIG.aliases === "object") {
    for (const [context, words] of Object.entries(AUTO_CONFIG.aliases)) {
      if (!Array.isArray(words) || !words.length) continue;
      aliases[context] = [...new Set([...(aliases[context] || []), ...words])];
    }
  }

  // A ordem é intencional: regras específicas têm prioridade sobre intenções genéricas.
  // Ex.: "quanto custa a taxa?" deve ser taxa, e "sou paciente e quero agendar" deve ser paciente.
  const intents = {
    patient:["ja sou paciente","já sou paciente","area do paciente","área do paciente","meu prontuario","meu prontuário","login","acessar meu painel"],
    appointmentFee:["taxa de agendamento","taxa para agendar","quanto custa a taxa","qual o valor da taxa","taxa","pagamento da taxa"],
    reschedule:["reagendar","reagendamento","remarcar","mudar a consulta"],
    delay:["atraso","atrasar","tolerancia","tolerância"],
    refund:["devolucao","devolução","reembolso","devolver a taxa"],
    address:["endereco exato","endereço exato","endereco da unidade","endereço da unidade","endereco completo","endereço completo","endereco","endereço","rua","numero","número"],
    booking:["quero marcar","quero agendar","quero consulta","quero atendimento","quero comecar","como faco para marcar","marcar consulta","agendar consulta"],
    consultaOnline:["consulta online","consulta de avaliacao","consulta de avaliação"],
    consultoria:["consultoria online","consultoria","programa essencial","programa premium"],
    homeCare:["cuidar em casa","cuidar da minha pele em casa","cuidados em casa","rotina de skincare","rotina para minha pele","rotina de cuidados","produtos para usar","o que usar em casa","orientacao para cuidar em casa","orientação para cuidar em casa"],
    price:["quanto custa","qual valor","preco","preço","investimento","quanto e","quanto é","valor da consulta","valor do atendimento","quanto custa a consultoria online","valor da consultoria online","preco da consultoria online","preço da consultoria online"],
    location:["onde atende","local","cidade","onde fica","atende onde"],
    presential:["presencial","presencialmente","atendimento presencial","consulta presencial"],
    online:["online","moro longe","sou de outro estado","nao moro no rio","não moro no rio","fora do rio"],
    information:["como funciona","como funciona o atendimento","quero saber mais","só queria saber","so queria saber","informacao","informação","duvida","dúvida"]
  };

  const pageContext = CONFIG.pageContexts[path] || inferContext(path);
  const STORAGE_KEY = "ep-bot-session-v1";
  const state = {
    context: pageContext,
    stage: "start",
    location: null,
    route: null,
    intent: null,
    need: null,
    goal: null,
    asked: new Set(),
    started: false,
    lastText: "",
    details: {
      need: null,
      goal: null,
      duration: null
    }
  };
  let transcript = [];
  let responseQueue = Promise.resolve();

  function saveSession() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        sessionId,
        conversationId,
        lastPath: path,
        state: {
          ...state,
          asked: Array.from(state.asked)
        },
        transcript
      }));
    } catch (error) {
      console.warn("[Bot] Não foi possível preservar a conversa:", error);
    }
  }

  function restoreSession() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (!saved?.state) return;

      sessionId = saved.sessionId || null;
      conversationId = saved.conversationId || null;
      Object.assign(state, saved.state);
      state.asked = new Set(saved.state.asked || []);
      transcript = Array.isArray(saved.transcript) ? saved.transcript : [];

      // A conversa permanece a mesma, mas o contexto acompanha a nova página.
      // Isso permite sair de Acne e entrar em Melasma sem apagar o histórico.
      if (saved.lastPath !== path) {
        state.context = pageContext;
        state.stage = pageContext === "home" ? "understand" : "explore";
        state.intent = null;
        state.lastText = "";
      }
    } catch (error) {
      console.warn("[Bot] Não foi possível restaurar a conversa:", error);
    }
  }

  restoreSession();

  function inferContext(urlPath) {
    const m = urlPath.match(/\/tratamentos\/([^/]+)\.html$/);
    if (m) {
      const slug = m[1];
      if (slug === "acne") return "acne";
      if (slug === "melasma") return "manchas";
      if (slug === "clareamento-facial") return "clareamento-facial";
      if (slug === "cicatriz") return "cicatrizes";
      if (slug === "esporotricose") return "esporotricose";
      if (slug === "poros-abertos") return "poros";
      if (slug === "rosacea") return "rosacea";
      if (slug === "rejuvenescimento") return "rejuvenescimento";
      if (slug === "limpeza-de-pele") return "limpeza-de-pele";
      if (slug === "clareamento") return "clareamento-corporal";
      if (slug === "celulite") return "celulite";
      if (slug === "leucodermia") return "leucodermia";
      if (slug === "acantose") return "acantose";
      if (slug === "corporal") return "gordura-localizada";
      if (slug === "definicao") return "definicao-corporal";
      return slug;
    }
    return "home";
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
    // Entre intenções encontradas, escolhe a expressão mais específica.
    // Isso evita que "quanto custa a taxa" seja tratado apenas como preço,
    // e reduz falsos positivos por palavras genéricas embutidas em outras.
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
    if (!best) {
      const normalizedText = normalize(text);
      if (/\bcuidar\b.*\bem casa\b/.test(normalizedText) || /\bcuidados?\b.*\bem casa\b/.test(normalizedText)) {
        return "homeCare";
      }
    }
    return best;
  }

  function detectTopic(text) {
    const n = normalize(text);
    let best = null;
    let bestLength = 0;

    // Escolhe a expressão específica mais longa entre os assuntos encontrados.
    // Isso evita que um termo genérico roube o contexto de um tratamento específico:
    // "definição corporal" > "corporal", "limpeza nanotecnológica" > "nanotecnologia",
    // "cicatriz de acne" > "acne", "clareamento facial" > "clareamento".
    for (const [topic, words] of Object.entries(aliases)) {
      for (const word of words) {
        const phrase = normalize(word);
        if (phrase && matchesPhrase(n, phrase) && phrase.length > bestLength) {
          best = topic;
          bestLength = phrase.length;
        }
      }
    }
    if (best) return best;

    // Fallback determinístico para descrições naturais que não usam o nome do tratamento.
    const fallbackRules = [
      ["acne", /\b(?:espinhas?|cravos?)\b.*\b(?:hormonais?|inflamadas?)\b|\b(?:hormonais?|inflamadas?)\b.*\b(?:espinhas?|cravos?)\b/],
      ["manchas", /\b(?:manchas?|pele)\b.*\b(?:escuras?|manchada|pigmentad[ao])\b/],
      ["oleosidade", /\b(?:pele|rosto)\b.*\b(?:oleoso|oleosa|muito oleosa)\b/],
      ["poros", /\b(?:poros?|porosidade)\b.*\b(?:abertos?|aparentes|dilatados?)\b/]
    ];
    for (const [topic, rule] of fallbackRules) {
      if (rule.test(n) && aliases[topic]) return topic;
    }
    return null;
  }

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
      ["macae", ["macae"]],
      ["saquarema", ["saquarema"]],
      ["iguaba grande", ["iguaba grande"]],
      ["sao pedro da aldeia", ["sao pedro da aldeia"]],
      ["arraial do cabo", ["arraial do cabo"]],
      ["armacao dos buzios", ["armacao dos buzios", "buzios"]],
      ["sao goncalo", ["sao goncalo"]]
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

  function extractVisitorDetails(text) {
    const normalizedText = normalize(text);
    const details = {};

    const duration = normalizedText.match(/\\b(?:ha|faz)\\s+(?:cerca de\\s+|aproximadamente\\s+|mais de\\s+)?\\d+\\s+(?:dias?|semanas?|meses?|anos?)\\b/);
    if (duration) details.duration = duration[0];

    const need = normalizedText.match(/\\b(?:me incomoda|me preocupa|o que mais me incomoda e|principalmente me incomoda)\\s+([^.!?]+)/);
    if (need) details.need = need[1].trim();

    const goal = normalizedText.match(/\\b(?:meu objetivo e|quero|gostaria de|pretendo)\\s+([^.!?]+)/);
    if (goal) details.goal = goal[1].trim();

    return details;
  }

  function locationLabel(key) {
    if (key === "araruama") return "Araruama, na região da Fazendinha";
    if (key === "cabo frio") return "Cabo Frio, na região da Riviera";
    if (key === "copacabana") return "Copacabana, na região de Siqueira Campos";
    return key ? key.replace(/-/g," ").replace(/\b\w/g, c => c.toUpperCase()) : "";
  }

  function isPresentialArea(location) {
    return [
      "araruama", "cabo frio", "copacabana",
      "saquarema", "iguaba grande", "sao pedro da aldeia",
      "arraial do cabo", "armacao dos buzios", "niteroi", "sao goncalo"
    ].includes(location);
  }

  function isNearbyPresential(location) {
    return [
      "saquarema", "iguaba grande", "sao pedro da aldeia",
      "arraial do cabo", "armacao dos buzios", "niteroi", "sao goncalo"
    ].includes(location);
  }

  async function ensureConversation() {
    if (conversationId) return conversationId;
    if (conversationPromise) return conversationPromise;

    conversationPromise = (async () => {
      const client = await getSupabaseClient();
      if (!client) return null;

      const { data, error } = await client
        .from("bot_conversations")
        .insert({
          session_id: getSessionId(),
          treatment_context: state.context,
          treatment_name: CONFIG.labels[state.context] || state.context,
          page_path: path
        })
        .select("id")
        .single();

      if (error) {
        console.warn("[Bot] Não foi possível abrir histórico:", error.message);
        return null;
      }
      conversationId = data.id;
      saveSession();
      return conversationId;
    })();

    try {
      return await conversationPromise;
    } finally {
      if (!conversationId) conversationPromise = null;
    }
  }

  function logMessage(text, sender) {
    void (async () => {
      const client = await getSupabaseClient();
      const id = await ensureConversation();
      if (!client || !id || !text) return;

      const { error } = await client.from("bot_messages").insert({
        conversation_id: id,
        session_id: getSessionId(),
        sender,
        message: String(text).slice(0, 4000),
        treatment_context: state.context,
        intent: state.intent,
        stage: state.stage,
        route: state.route,
        city: state.location
      });

      if (error) console.warn("[Bot] Não foi possível registrar mensagem:", error.message);
    })();
  }

  function logWhatsAppHandoff() {
    void (async () => {
      const client = await getSupabaseClient();
      const id = await ensureConversation();
      if (!client || !id) return;
      await client.from("bot_messages").insert({
        conversation_id: id,
        session_id: getSessionId(),
        sender: "system",
        message: "whatsapp_handoff",
        treatment_context: state.context,
        intent: state.intent,
        stage: state.stage,
        route: state.route,
        city: state.location
      });
    })();
  }

  function renderMessage(text, who, link, linkLabel) {
    const bubble = document.createElement("div");
    bubble.className = "ep-bot__msg ep-bot__msg--" + who;
    bubble.textContent = text;
    if (link) {
      const a = document.createElement("a");
      a.className = "ep-bot__link";
      a.href = link;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = linkLabel || "Continuar pelo WhatsApp →";
      bubble.appendChild(a);
    }
    els.messages.appendChild(bubble);
    els.messages.scrollTop = els.messages.scrollHeight;
    return bubble;
  }

  function addMessage(text, who, link, linkLabel) {
    renderMessage(text, who, link, linkLabel);
    transcript.push({ text: String(text), who, link: link || null });
    saveSession();
    if (who === "bot") logMessage(text, "bot");
    if (link && (!linkLabel || linkLabel === "Continuar pelo WhatsApp →")) logWhatsAppHandoff();
  }

  function restoreTranscript() {
    transcript.forEach((item) => renderMessage(item.text, item.who, item.link));
  }

  function wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  async function typeReply(text, link, linkLabel) {
    const typing = document.createElement("div");
    typing.className = "ep-bot__typing";
    typing.setAttribute("aria-label", "Atendente escrevendo");
    typing.innerHTML = "<span></span><span></span><span></span>";
    els.messages.appendChild(typing);
    els.messages.scrollTop = els.messages.scrollHeight;
    await wait(420);
    typing.remove();

    const bubble = document.createElement("div");
    bubble.className = "ep-bot__msg ep-bot__msg--bot";
    els.messages.appendChild(bubble);
    let visible = "";
    for (const char of Array.from(String(text))) {
      visible += char;
      bubble.textContent = visible;
      els.messages.scrollTop = els.messages.scrollHeight;
      await wait(char === " " ? 8 : 18);
    }

    if (link) {
      const a = document.createElement("a");
      a.className = "ep-bot__link";
      a.href = link;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = linkLabel || "Continuar pelo WhatsApp →";
      bubble.appendChild(a);
    }

    transcript.push({ text: String(text), who: "bot", link: link || null });
    saveSession();
    logMessage(text, "bot");
    if (link && (!linkLabel || linkLabel === "Continuar pelo WhatsApp →")) logWhatsAppHandoff();
  }

  function reply(text, link, linkLabel) {
    responseQueue = responseQueue.then(() => typeReply(text, link, linkLabel));
    return responseQueue;
  }

  function currentWhatsApp() {
    const link = document.querySelector("[data-whatsapp-link]")?.getAttribute("href");
    return link && /^https:\/\/wa\.me\//.test(link) ? link : null;
  }

  function greeting() {
    const g = CONFIG.greetings[state.context] || CONFIG.greetings.home;
    reply(g);
    state.stage = state.context === "home" ? "understand" : "explore";
  }

  function treatmentMode() {
    return CONFIG.treatmentModes?.[state.context] || null;
  }

  function explainConsultoria() {
    const mode = treatmentMode();

    if (mode && mode.consultoria !== true) {
      reply("A Consultoria de Skincare Regenerativo é voltada aos cuidados domiciliares da pele, especialmente da face. Para " + (CONFIG.labels[state.context] || state.context) + ", ela não é o atendimento indicado.");
      explainOnlineTreatment();
      return;
    }

    state.route = "consultoria";
    state.stage = "consultoria";
    reply("A Consultoria de Skincare Regenerativo é voltada aos cuidados domiciliares da pele, especialmente da face. A partir da avaliação da sua pele, orientamos a rotina, ativos e dermocosméticos e acompanhamos os ajustes necessários.");
    reply("Ela pode ser uma opção quando o objetivo é organizar os cuidados em casa. Quando você procura um tratamento específico, o caminho pode ser uma consulta de avaliação para verificarmos se o caso pode ser conduzido online.");
  }

  function explainHomeCare() {
    const mode = treatmentMode();

    if (!mode || mode.consultoria === true) {
      explainConsultoria();
      return;
    }

    const label = CONFIG.labels[state.context] || state.context;
    reply("Entendi. Você está buscando orientação para cuidar de " + label + " em casa.");
    reply("A Consultoria de Skincare Regenerativo é voltada aos cuidados domiciliares da pele, especialmente da face, então não é o caminho indicado para " + label + ".");

    explainOnlineTreatment();
  }

  function explainOnlineTreatment() {
    const mode = treatmentMode();
    if (!mode) {
      state.route = "online";
      reply("A Consultoria de Skincare Regenerativo Online atende todo o Brasil. Hoje existem os programas Essencial e Premium. Se quiser, posso te explicar as diferenças ou informar os valores.");
      state.stage = "online";
      return;
    }

    if (mode.online === "consulta") {
      state.route = "online-consulta";
      reply("Para " + (CONFIG.labels[state.context] || state.context) + ", o atendimento online começa por uma consulta de avaliação. Nessa consulta, verificamos se o seu caso pode ser conduzido de forma online. Não é uma consultoria.");
      if (mode.requiresPreAttendance) {
        reply("Antes da consulta, é necessário preencher o pré-atendimento para que a equipe possa analisar suas informações.", CONFIG.routes.preAttendance, "Preencher pré-atendimento →");
      }
      state.stage = "online-consulta";
      return;
    }

    state.route = "presential-required";
    reply("Para " + (CONFIG.labels[state.context] || state.context) + ", a execução do tratamento é presencial. O atendimento online não substitui o procedimento.");
    if (state.location && (isPresentialArea(state.location) || isNearbyPresential(state.location))) {
      reply("Como você está em " + locationLabel(state.location) + ", podemos orientar o caminho para atendimento presencial pelo pré-atendimento.", CONFIG.routes.preAttendance, "Preencher pré-atendimento →");
    } else {
      reply("Se você puder realizar o atendimento presencial, posso te orientar pelo WhatsApp sobre as possibilidades e a região de atendimento.", currentWhatsApp());
    }
    state.stage = "presential";
  }

  function routeByLocation() {
    if (!state.location) {
      reply("Para eu te orientar sobre o caminho de atendimento, você está em qual cidade?");
      state.stage = "location";
      return;
    }

    const mode = treatmentMode();
    if (state.context === "limpeza-de-pele") {
      if (isPresentialArea(state.location) || isNearbyPresential(state.location)) {
        state.route = "presential";
        state.stage = "next";
        reply("A Limpeza de Pele Nanotecnológica é realizada presencialmente. Como você está em " + locationLabel(state.location) + ", posso te encaminhar para o WhatsApp para verificar o atendimento e o agendamento.", currentWhatsApp());
      } else {
        state.route = "presential-required";
        state.stage = "next";
        reply("A Limpeza de Pele Nanotecnológica é realizada somente de forma presencial. O atendimento ocorre nas unidades de Araruama, Cabo Frio e Copacabana.");
        reply("Se você estiver em uma dessas regiões ou puder se deslocar até uma das unidades, posso te encaminhar para o WhatsApp para receber as orientações.");
      }
      return;
    }

    if (mode?.online === "consulta" && !isPresentialArea(state.location) && !isNearbyPresential(state.location)) {
      explainOnlineTreatment();
      return;
    }

    const local = ["araruama","cabo frio","copacabana"].includes(state.location);
    const nearby = isNearbyPresential(state.location);
    if (local || nearby) {
      state.route = "presential";
      if (nearby) {
        reply("Entendi. Você está em " + locationLabel(state.location) + ", uma região próxima das áreas onde temos atendimento presencial. Para verificarmos a melhor possibilidade para o seu caso, recomendo preencher o pré-atendimento do site.");
        reply("Depois do envio do formulário, a equipe poderá analisar seus dados e orientar o próximo passo.", CONFIG.routes.preAttendance, "Preencher pré-atendimento →");
      } else {
        reply("Temos atendimento em " + locationLabel(state.location) + ". O endereço completo é informado após o agendamento. Se você quiser atendimento presencial, recomendo começar pelo pré-atendimento do site.");
        reply("O formulário ajuda a organizar as informações antes da orientação da equipe.", CONFIG.routes.preAttendance, "Preencher pré-atendimento →");
      }
      state.stage = "presential";
    } else {
      explainOnlineTreatment();
    }
  }

  function askTreatmentLocation() {
    state.stage = "location";
    reply("Antes de te passar os detalhes do atendimento, preciso saber de onde você é. Qual é a sua cidade?");
  }

  function answerTreatmentLocationInfo() {
    reply("Temos três polos de atendimento presencial: Araruama, Cabo Frio e Copacabana.");
    reply("Quando o atendimento é encaminhado pelo WhatsApp, a equipe confirma a unidade adequada e passa o endereço completo após o agendamento ser efetuado.");
  }

  function answerPrice() {
    const mode = treatmentMode();
    const explicitOnline = matchesPhrase(state.lastText, "online");
    const explicitConsultoria = matchesPhrase(state.lastText, "consultoria online") || matchesPhrase(state.lastText, "consultoria");
    const nonLocalCity = state.location && !isPresentialArea(state.location) && !isNearbyPresential(state.location);

    if (explicitConsultoria || state.intent === "consultoria") {
      if (!mode || mode.consultoria === true || state.context === "consultoria") {
        reply("A Consultoria de Skincare Regenerativo tem dois programas: Essencial por R$ " + CONFIG.onlineConsultation.essential + " e Premium por R$ " + CONFIG.onlineConsultation.premium + ".");
        state.stage = "consultoria";
      } else {
        explainConsultoria();
      }
      return;
    }

    if (state.intent === "homeCare") {
      if (!mode || mode.consultoria === true) {
        reply("A Consultoria de Skincare Regenerativo tem dois programas: Essencial por R$ " + CONFIG.onlineConsultation.essential + " e Premium por R$ " + CONFIG.onlineConsultation.premium + ".");
        state.stage = "consultoria";
      } else {
        explainHomeCare();
      }
      return;
    }

    if (mode && mode.presential && !state.location && !explicitOnline && !explicitConsultoria && state.intent !== "homeCare") {
      askTreatmentLocation();
      return;
    }

    if (mode?.online === "consulta") {
      reply("Para " + (CONFIG.labels[state.context] || state.context) + ", o atendimento online começa por uma consulta de avaliação. O valor da consulta não está sendo informado pelo bot; posso te encaminhar para o WhatsApp para receber o valor correto e as orientações sobre o pré-atendimento.", currentWhatsApp());
      state.stage = "next";
      return;
    }

    if (mode && mode.online === false) {
      reply("Para " + (CONFIG.labels[state.context] || state.context) + ", o tratamento é presencial. O valor depende do atendimento indicado para o seu caso. Posso te encaminhar para o WhatsApp.", currentWhatsApp());
      state.stage = "next";
      return;
    }

    if (state.route === "online" || state.context === "consultoria" || explicitOnline || nonLocalCity) {
      reply("Hoje temos dois programas de consultoria online: o Essencial, de R$ " + CONFIG.onlineConsultation.essential + ", e o Premium, de R$ " + CONFIG.onlineConsultation.premium + ". Cada um possui uma proposta de acompanhamento diferente. Posso te explicar as diferenças.");
      state.stage = "online";
    } else {
      reply("A definição do valor depende do tipo de atendimento. Para receber as informações correspondentes ao atendimento que você procura, posso te encaminhar para o WhatsApp.", currentWhatsApp());
      state.stage = "next";
    }
  }

  function answerRule(intent) {
    if (intent === "appointmentFee") {
      reply("A taxa de agendamento varia de acordo com o tipo de consulta. Ela é utilizada para reservar o horário, organizar o atendimento e permitir a preparação prévia. Para saber o valor correspondente ao atendimento que você deseja, posso te encaminhar para o WhatsApp.", currentWhatsApp());
      return true;
    }
    if (intent === "reschedule") {
      reply("Solicitações de reagendamento devem ser feitas com pelo menos 24 horas de antecedência.");
      return true;
    }
    if (intent === "delay") {
      reply("A tolerância máxima para atraso é de 10 minutos.");
      return true;
    }
    if (intent === "refund") {
      reply("A taxa de agendamento não é devolvida.");
      return true;
    }
    if (intent === "patient") {
      reply("Claro. A área do paciente é separada e protegida por autenticação. Para acessar seu painel, use o Login do Paciente.", null);
      const a=document.createElement("a");a.className="ep-bot__link";a.href=CONFIG.routes.patientLogin;a.textContent="Acessar Login do Paciente →";els.messages.appendChild(a);
      return true;
    }
    return false;
  }

  function nextQuestion() {
    if (state.stage === "explore") {
      if (state.details.need) {
        state.stage = "goal";
      } else {
        state.stage = "problem";
        reply("O que mais te incomoda atualmente nessa questão?");
        return;
      }
    }
    if (state.stage === "problem") {
      if (state.details.goal) {
        state.stage = "location";
        routeByLocation();
        return;
      }
      state.stage = "goal";
      reply("Se você pudesse melhorar uma coisa primeiro, o que gostaria de ver diferente?");
      return;
    }
    if (state.stage === "goal") {
      state.stage = "location";
      routeByLocation();
    }
  }

  function handle(text) {
    state.lastText = text;
    const n = normalize(text);
    const intent = detectIntent(text);
    const topic = detectTopic(text);
    const loc = detectLocation(text);
    const details = extractVisitorDetails(text);
    const previousContext = state.context;

    if (topic && topic !== state.context) {
      state.context = topic;
    }
    if (loc) state.location = loc;
    if (details.need) state.details.need = details.need;
    if (details.goal) state.details.goal = details.goal;
    if (details.duration) state.details.duration = details.duration;
    if (intent) state.intent = intent;

    // Registra a mensagem do visitante somente depois de atualizar contexto,
    // intenção, cidade e estado, para que o histórico reflita a decisão real do motor.
    logMessage(text, "visitor");

    if (answerRule(intent)) return;

    if (intent === "consultoria") {
      explainConsultoria();
      return;
    }

    if (intent === "homeCare") {
      explainHomeCare();
      return;
    }

    if (intent === "consultaOnline") {
      explainOnlineTreatment();
      return;
    }

    // Limpeza de pele: a cidade é obrigatória antes de encaminhar ou explicar a rota.
    if (state.context === "limpeza-de-pele" && !state.location) {
      state.started = true;
      state.stage = "location";
      reply("Entendi. Para a Limpeza de Pele Nanotecnológica, primeiro preciso saber de onde você é. Qual é a sua cidade?");
      return;
    }

    if (intent === "booking") {
      // O agendamento sempre precisa passar pela localização antes do encaminhamento.
      // Assim o bot não envia a pessoa direto para o WhatsApp sem saber de onde ela é.
      if (!state.location) {
        state.stage = "location";
        reply("Perfeito. Antes de te encaminhar para o agendamento, preciso saber de onde você é. Qual é a sua cidade?");
        return;
      }

      routeByLocation();
      return;
    }

    if (intent === "price") {
      answerPrice();
      return;
    }

    if (intent === "address") {
      answerTreatmentLocationInfo();
      return;
    }

    if (intent === "location") {
      if (matchesPhrase(n, "onde atende") || matchesPhrase(n, "onde fica")) {
        answerTreatmentLocationInfo();
      } else if (state.location) {
        routeByLocation();
      } else {
        reply("Você está em qual cidade?");
        state.stage = "location";
      }
      return;
    }

    if (intent === "presential") {
      const mode = treatmentMode();
      if (mode && mode.presential === false) {
        reply("No momento, " + (CONFIG.labels[state.context] || state.context) + " não está configurado para atendimento presencial.");
        state.stage = "next";
        return;
      }
      state.route = "presential";
      if (state.location) {
        routeByLocation();
      } else {
        reply("Claro. Para eu verificar a melhor orientação para atendimento presencial, você está em qual cidade?");
        state.stage = "location";
      }
      return;
    }

    if (intent === "online") {
      explainOnlineTreatment();
      return;
    }

    if (intent === "information") {
      reply("Claro. Posso explicar a metodologia, os atendimentos, a consultoria online, as regras de agendamento ou alguma questão específica relacionada ao conteúdo desta página. O que você gostaria de entender?");
      state.stage = "information";
      return;
    }

    if (state.stage === "location") {
      if (loc) routeByLocation();
      else reply("Não consegui identificar a cidade. Pode me dizer apenas o nome da cidade onde você está?");
      return;
    }

    if (topic && topic !== previousContext) {
      // Ao trocar de tratamento, a cidade continua sendo contexto geográfico,
      // mas rota e intenção anterior não podem contaminar o novo tratamento.
      state.route = null;
      state.intent = intent || null;
      state.started = true;
      state.stage = "explore";
      reply("Entendi. Vamos mudar o foco da conversa para " + (CONFIG.labels[state.context] || state.context) + ".");
      if (state.location) routeByLocation();
      else nextQuestion();
      return;
    }

    if (state.stage === "presential") {
      if (/^(sim|s|quero|claro|pode|presencial)/i.test(n)) {
        reply("O atendimento presencial funciona mediante agendamento. Existe uma taxa de agendamento, cujo valor varia conforme o tipo de consulta. Após o pagamento, você recebe a ficha de anamnese online e o informativo de preparação. A ficha deve ser preenchida até 3 dias antes da consulta.");
        reply("Se quiser marcar, posso te encaminhar para o WhatsApp.", currentWhatsApp());
        state.stage = "next";
      } else {
        nextQuestion();
      }
      return;
    }

    if (state.stage === "online-consulta") {
      if (matchesPhrase(n, "sim") || matchesPhrase(n, "quero") || matchesPhrase(n, "pode")) {
        reply("Perfeito. O próximo passo é preencher o pré-atendimento para que a equipe avalie suas informações e oriente a consulta.", CONFIG.routes.preAttendance, "Preencher pré-atendimento →");
      } else {
        reply("Essa consulta serve para avaliar o seu caso e verificar se o tratamento pode ser conduzido online. Se quiser seguir, posso te encaminhar para o pré-atendimento.");
      }
      return;
    }

    if (state.stage === "consultoria") {
      if (matchesPhrase(n, "diferenca") || matchesPhrase(n, "diferença") || matchesPhrase(n, "programa") || matchesPhrase(n, "essencial") || matchesPhrase(n, "premium")) {
        reply("O Essencial custa R$ " + CONFIG.onlineConsultation.essential + " e inclui pagamento da taxa de agendamento, ficha de anamnese, primeira consulta, segunda consulta 30 dias depois, análise e ajustes. O Premium custa R$ " + CONFIG.onlineConsultation.premium + " e inclui primeira consulta, segunda consulta em até 6 dias, material personalizado/informativo, acompanhamento durante 30 dias e terceira consulta para feedback e ajuste da rotina.");
        reply("Se quiser iniciar a consultoria, posso te encaminhar para o WhatsApp.", currentWhatsApp());
      } else {
        reply("A consultoria é voltada aos cuidados domiciliares. Se você estiver buscando tratar uma condição específica, também posso explicar quando o caminho é uma consulta de avaliação.");
      }
      return;
    }

    if (state.stage === "online") {
      if (matchesPhrase(n, "diferenca") || matchesPhrase(n, "programa") || matchesPhrase(n, "essencial") || matchesPhrase(n, "premium")) {
        reply("O Essencial custa R$ " + CONFIG.onlineConsultation.essential + " e inclui pagamento da taxa de agendamento, ficha de anamnese, primeira consulta, segunda consulta 30 dias depois, análise e ajustes. O Premium custa R$ " + CONFIG.onlineConsultation.premium + " e inclui primeira consulta, segunda consulta em até 6 dias, material personalizado/informativo, acompanhamento durante 30 dias e terceira consulta para feedback e ajuste da rotina.");
        reply("Se quiser iniciar o atendimento, posso te encaminhar para o WhatsApp.", currentWhatsApp());
      } else if (matchesPhrase(n, "sim") || matchesPhrase(n, "quero") || matchesPhrase(n, "pode")) {
        reply("Posso te explicar os dois programas: Essencial por R$ " + CONFIG.onlineConsultation.essential + " e Premium por R$ " + CONFIG.onlineConsultation.premium + ". Quer comparar os dois?");
      } else {
        reply("Posso te explicar os programas, informar os valores públicos ou encaminhar você para o WhatsApp quando quiser iniciar.");
      }
      return;
    }

    if (topic) {
      state.started = true;
      reply("Entendi. Então vamos considerar " + (CONFIG.labels[state.context] || state.context) + " como o assunto principal desta conversa.");
      if (state.location) routeByLocation();
      else nextQuestion();
      return;
    }

    if (state.stage === "information") {
      reply("A proposta é começar entendendo o contexto, a necessidade e o objetivo, e então indicar o caminho de atendimento correspondente. Se você me disser o que está buscando, consigo direcionar melhor.");
      state.stage = "explore";
      return;
    }

    if (state.stage === "start" || !state.started) {
      state.started = true;
      greeting();
      return;
    }

    nextQuestion();
  }

  const root = document.createElement("div");
  root.className = "ep-bot";
  root.innerHTML = `
    <div class="ep-bot__panel" role="dialog" aria-label="Assistente de triagem">
      <div class="ep-bot__header">
        <div><div class="ep-bot__brand">Especialista em Pele</div><div class="ep-bot__status">Assistente de triagem</div></div>
        <button class="ep-bot__close" type="button" aria-label="Fechar">×</button>
      </div>
      <div class="ep-bot__privacy">As mensagens podem ser registradas para organizar o atendimento. Evite enviar dados pessoais ou informações de saúde desnecessárias. <a href="/privacidade.html" target="_blank" rel="noopener">Saiba mais</a>.</div>
      <div class="ep-bot__messages" aria-live="polite"></div>
      <div class="ep-bot__quick"></div>
      <form class="ep-bot__form">
        <input class="ep-bot__input" type="text" autocomplete="off" placeholder="Escreva sua mensagem…">
        <button class="ep-bot__send" type="submit" aria-label="Enviar">→</button>
      </form>
    </div>
    <div class="ep-bot__teaser" role="status" aria-live="polite">
      <button class="ep-bot__teaser-close" type="button" aria-label="Fechar mensagem">×</button>
      <div class="ep-bot__teaser-title">Atendente Virtual</div>
      <div class="ep-bot__teaser-text"></div>
      <button class="ep-bot__teaser-action" type="button">Quero saber mais →</button>
    </div>
    <button class="ep-bot__toggle" type="button" aria-label="Abrir assistente"><span class="ep-bot__toggle-icon" aria-hidden="true"><svg viewBox="0 0 24 24" role="img"><path d="M5 5.5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-4.5 3v-3H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z"></path><path d="M7 9h10M7 12h7" class="ep-bot__toggle-line"></path></svg></span></button>
  `;
  document.body.appendChild(root);

  const els = {
    root,
    panel: root.querySelector(".ep-bot__panel"),
    toggle: root.querySelector(".ep-bot__toggle"),
    close: root.querySelector(".ep-bot__close"),
    messages: root.querySelector(".ep-bot__messages"),
    quick: root.querySelector(".ep-bot__quick"),
    form: root.querySelector(".ep-bot__form"),
    input: root.querySelector(".ep-bot__input"),
    teaser: root.querySelector(".ep-bot__teaser"),
    teaserText: root.querySelector(".ep-bot__teaser-text"),
    teaserAction: root.querySelector(".ep-bot__teaser-action"),
    teaserClose: root.querySelector(".ep-bot__teaser-close")
  };

  function contextualTeaser() {
    const label = CONFIG.labels[state.context];
    if (label && state.context !== "home") {
      return "Vi que você está conhecendo nosso conteúdo sobre " + label + ". Posso te ajudar com informações ou orientar o próximo passo.";
    }
    if (state.context === "consultoria") {
      return "Vi que você está conhecendo nossa consultoria online. Posso explicar como funciona e quais são as opções.";
    }
    if (state.context === "pele") {
      return "Vi que você está conhecendo nossa abordagem para a saúde da pele. Posso ajudar a encontrar o caminho mais adequado.";
    }
    return "Olá! Posso ajudar você a entender os atendimentos e encontrar o caminho mais adequado para o que está buscando.";
  }

  function showContextualTeaser() {
    if (!els.teaser || state.started || root.classList.contains("is-open")) return;
    try {
      if (sessionStorage.getItem("ep-bot-teaser:" + path) === "1") return;
      sessionStorage.setItem("ep-bot-teaser:" + path, "1");
    } catch {}
    els.teaserText.textContent = contextualTeaser();
    els.teaser.classList.add("is-visible");
  }

  function openAssistant() {
    els.teaser.classList.remove("is-visible");
    root.classList.add("is-open");
    if (!state.started) {
      state.started = true;
      setTimeout(greeting, 120);
    }
    els.input.focus();
  }

  function quickButtons() {
    const items = [
      ["Como funciona?", "como funciona"],
      ["Valores online", "quanto custa a consultoria online"],
      ["Onde atende?", "onde atende"],
      ["Quero agendar", "quero agendar"]
    ];
    items.forEach(([label,value]) => {
      const b=document.createElement("button");b.type="button";b.textContent=label;
      b.addEventListener("click",()=>{addMessage(value,"user");handle(value);els.quick.innerHTML="";});
      els.quick.appendChild(b);
    });
  }

  restoreTranscript();
  saveSession();

  els.toggle.addEventListener("click", openAssistant);
  els.teaserAction.addEventListener("click", openAssistant);
  els.teaserClose.addEventListener("click", () => els.teaser.classList.remove("is-visible"));
  els.close.addEventListener("click", () => root.classList.remove("is-open"));

  // A abordagem contextual é o gatilho visual inicial do assistente.
  // Não abre o chat sozinho: apresenta uma mensagem relacionada à página
  // e deixa a decisão de iniciar a conversa com o visitante.
  const teaserTimer = window.setTimeout(showContextualTeaser, 4500);
  window.addEventListener("scroll", () => {
    if (window.scrollY > Math.max(240, document.documentElement.scrollHeight * 0.18)) {
      showContextualTeaser();
      window.clearTimeout(teaserTimer);
    }
  }, { passive: true });
  window.addEventListener("pagehide", saveSession);
  window.addEventListener("beforeunload", saveSession);

  els.form.addEventListener("submit", (e) => {
    e.preventDefault();
    const value=els.input.value.trim();
    if (!value) return;
    addMessage(value,"user");
    els.input.value="";
    els.quick.innerHTML="";
    handle(value);
  });
  quickButtons();
})();
