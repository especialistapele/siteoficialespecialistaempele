/* Bot de Triagem — motor determinístico, sem IA */
(function () {
  "use strict";

  const CONFIG = window.ESPECIALISTA_PELE_BOT_CONFIG;
  if (!CONFIG) return;

  // Registro das conversas: o motor continua determinístico e o histórico
  // é persistido separadamente no Supabase para consulta exclusiva do admin.
  const SUPABASE_URL = "https://clwaotfbqwvxpykruwed.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzcHViYXNlIiwicmVmIjoiY2x3YW90ZmJxend4cHlrcnV3ZWQiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc4ODgwNzQ5MywiZXhwIjoyMTA0MzgzNDkzfQ.Cw9zJU8UIkxhzjI-adNHoRTyNuGingHpTHZ6pjJBgBc";
  let supabaseClient = null;
  let conversationId = null;
  let sessionId = null;

  async function getSupabaseClient() {
    if (supabaseClient) return supabaseClient;
    try {
      const mod = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
      supabaseClient = mod.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
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
    acne:["acne","espinha","espinhas","cravo","cravos"],
    manchas:["mancha","manchas","melasma","pigmentacao"],
    cicatrizes:["cicatriz","cicatrizes","marca de acne","marcas de acne"],
    rosacea:["rosacea","vermelhidao","vermelhida"],
    rejuvenescimento:["rejuvenescimento","rugas","linhas","flacidez facial","envelhecimento"],
    poros:["poro","poros","poro dilatado","poros dilatados"],
    nanotecnologia:["nanotecnologia"],
    clareamento:["clareamento","virilha","coxas","axila","gluteos"],
    remocoes:["remocao","remover","sinal","sinais","verruga","nevo","nigras","milium","xantelasma","siringoma"],
    corporal:["corporal"],
    operatorio:["operatorio","pos operatorio","pos-operatorio"],
    sobrancelha:["sobrancelha","sobrancelhas","despigmentacao de sobrancelha","despigmentação de sobrancelha","tirar a micropigmentacao","tirar a micropigmentação","sobrancelha manchada"],
    "clareamento-facial":["clareamento facial","clarear o rosto","manchas no rosto"],
    "clareamento-corporal":["clareamento corporal","clarear virilha","clarear a virilha","clarear axila","clarear a axila","clarear coxas","clarear as coxas","clarear gluteos","clarear os gluteos"],
    "limpeza-de-pele":["limpeza de pele","limpeza nanotecnologica"],
    celulite:["celulite"],
    estrias:["estria","estrias"],
    flacidez:["flacidez"],
    esporotricose:["esporotricose","cicatriz de esporotricose","cicatrizes por esporotricose"],
    leucodermia:["leucodermia","leucodermia solar"],
    acantose:["acantose","acantose nigricans","pescoco escuro","pescoço escuro","pele escura nas dobras"],
    "gordura-localizada":["gordura localizada","gordura abdominal","gordura"],
    "definicao-corporal":["definicao corporal","definição corporal","definicao"]
  };

  // A ordem é intencional: regras específicas têm prioridade sobre intenções genéricas.
  // Ex.: "quanto custa a taxa?" deve ser taxa, e "sou paciente e quero agendar" deve ser paciente.
  const intents = {
    patient:["ja sou paciente","já sou paciente","area do paciente","área do paciente","meu prontuario","meu prontuário","login","acessar meu painel"],
    appointmentFee:["taxa de agendamento","taxa para agendar","quanto custa a taxa","qual o valor da taxa","taxa","pagamento da taxa"],
    reschedule:["reagendar","reagendamento","remarcar","mudar a consulta"],
    delay:["atraso","atrasar","tolerancia","tolerância"],
    refund:["devolucao","devolução","reembolso","devolver a taxa"],
    address:["endereco","endereço","endereco completo","endereço completo","rua","numero","número"],
    booking:["quero marcar","quero agendar","quero consulta","quero atendimento","quero comecar","como faco para marcar","marcar consulta","agendar consulta"],
    price:["quanto custa","qual valor","preco","preço","investimento","quanto e","quanto é","valor da consulta","valor do atendimento"],
    location:["onde atende","local","cidade","onde fica","atende onde"],
    online:["online","moro longe","sou de outro estado","nao moro no rio","não moro no rio","fora do rio","consultoria online"],
    information:["como funciona","como funciona o atendimento","quero saber mais","só queria saber","so queria saber","informacao","informação","duvida","dúvida"]
  };

  const state = {
    context: CONFIG.pageContexts[path] || inferContext(path),
    stage: "start",
    location: null,
    route: null,
    intent: null,
    need: null,
    goal: null,
    asked: new Set(),
    started: false
  };

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

  function detectIntent(text) {
    const n = normalize(text);
    for (const [intent, words] of Object.entries(intents)) {
      if (words.some((w) => n.includes(normalize(w)))) return intent;
    }
    return null;
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
        if (phrase && n.includes(phrase) && phrase.length > bestLength) {
          best = topic;
          bestLength = phrase.length;
        }
      }
    }
    return best;
  }

  function detectLocation(text) {
    const n = normalize(text);
    if (n.includes("araruama") || n.includes("fazendinha")) return "araruama";
    if (n.includes("cabo frio") || n.includes("riviera")) return "cabo frio";
    if (n.includes("copacabana") || n.includes("siqueira campos") || n.includes("rio de janeiro")) return "copacabana";
    const cities = ["sao paulo","curitiba","belo horizonte","vitoria","brasilia","salvador","niteroi","petropolis","marica","macae"];
    const found = cities.find(c => n.includes(c));
    return found ? found : null;
  }

  function locationLabel(key) {
    if (key === "araruama") return "Araruama, na região da Fazendinha";
    if (key === "cabo frio") return "Cabo Frio, na região da Riviera";
    if (key === "copacabana") return "Copacabana, na região de Siqueira Campos";
    return key ? key.replace(/-/g," ").replace(/\b\w/g, c => c.toUpperCase()) : "";
  }

  async function ensureConversation() {
    if (conversationId) return conversationId;
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
    return conversationId;
  }

  function logMessage(text, sender) {
    void (async () => {
      const client = await getSupabaseClient();
      const id = await ensureConversation();
      if (!client || !id || !text) return;

      const { error } = await client.from("bot_messages").insert({
        conversation_id: id,
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

  function addMessage(text, who, link) {
    const bubble = document.createElement("div");
    bubble.className = "ep-bot__msg ep-bot__msg--" + who;
    bubble.textContent = text;
    if (link) {
      const a = document.createElement("a");
      a.className = "ep-bot__link";
      a.href = link;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = "Continuar pelo WhatsApp →";
      bubble.appendChild(a);
    }
    els.messages.appendChild(bubble);
    els.messages.scrollTop = els.messages.scrollHeight;
    if (who === "user" || who === "bot") logMessage(text, who === "user" ? "visitor" : "bot");
    if (link) logWhatsAppHandoff();
  }

  function reply(text, link) {
    addMessage(text, "bot", link);
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

  function routeByLocation() {
    if (!state.location) {
      reply("Para eu te orientar sobre o caminho de atendimento, você está em qual cidade?");
      state.stage = "location";
      return;
    }
    const local = ["araruama","cabo frio","copacabana"].includes(state.location);
    if (local) {
      state.route = "presential";
      reply("Temos atendimento em " + locationLabel(state.location) + ". O endereço completo é informado após o agendamento. Você gostaria de conhecer como funciona o atendimento presencial?");
      state.stage = "presential";
    } else {
      state.route = "online";
      reply("Entendi. Como você está em " + locationLabel(state.location) + ", uma possibilidade é a Consultoria de Skincare Regenerativo Online, que atende todo o Brasil. Você gostaria que eu te explique como funciona?");
      state.stage = "online";
    }
  }

  function answerPrice() {
    if (state.route === "online" || state.context === "consultoria" || normalize(state.lastText).includes("online")) {
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
      state.stage = "problem";
      reply("O que mais te incomoda atualmente nessa questão?");
      return;
    }
    if (state.stage === "problem") {
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

    if (topic && topic !== state.context) {
      state.context = topic;
    }
    if (loc) state.location = loc;
    if (intent) state.intent = intent;

    if (answerRule(intent)) return;

    if (intent === "booking") {
      reply("Perfeito. Para dar continuidade ao seu agendamento, vou te encaminhar para o WhatsApp. Por lá você poderá enviar seus dados e receber as orientações para seguir com o atendimento.", currentWhatsApp());
      state.stage = "next";
      return;
    }

    if (intent === "price") {
      answerPrice();
      return;
    }

    if (intent === "address") {
      if (state.location) {
        reply("O atendimento acontece na região de " + locationLabel(state.location) + ". O endereço completo é informado após a realização do agendamento.");
      } else {
        reply("Posso informar a região de atendimento, mas o endereço completo é informado após a realização do agendamento. Você está em qual cidade?");
        state.stage = "location";
      }
      return;
    }

    if (intent === "location") {
      if (state.location) routeByLocation();
      else { reply("Você está em qual cidade?"); state.stage = "location"; }
      return;
    }

    if (intent === "online") {
      state.route = "online";
      reply("A Consultoria de Skincare Regenerativo Online atende todo o Brasil. Hoje existem os programas Essencial e Premium. Se quiser, posso te explicar as diferenças ou informar os valores.");
      state.stage = "online";
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

    if (state.stage === "online") {
      if (n.includes("diferenca") || n.includes("diferença") || n.includes("programa") || n.includes("essencial") || n.includes("premium")) {
        reply("O Essencial custa R$ " + CONFIG.onlineConsultation.essential + " e inclui pagamento da taxa de agendamento, ficha de anamnese, primeira consulta, segunda consulta 30 dias depois, análise e ajustes. O Premium custa R$ " + CONFIG.onlineConsultation.premium + " e inclui primeira consulta, segunda consulta em até 6 dias, material personalizado/informativo, acompanhamento durante 30 dias e terceira consulta para feedback e ajuste da rotina.");
        reply("Se quiser iniciar o atendimento, posso te encaminhar para o WhatsApp.", currentWhatsApp());
      } else if (n.includes("sim") || n.includes("quero") || n.includes("pode")) {
        reply("Posso te explicar os dois programas: Essencial por R$ " + CONFIG.onlineConsultation.essential + " e Premium por R$ " + CONFIG.onlineConsultation.premium + ". Quer comparar os dois?");
      } else {
        reply("Posso te explicar os programas, informar os valores públicos ou encaminhar você para o WhatsApp quando quiser iniciar.");
      }
      return;
    }

    if (topic) {
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
      <div class="ep-bot__messages" aria-live="polite"></div>
      <div class="ep-bot__quick"></div>
      <form class="ep-bot__form">
        <input class="ep-bot__input" type="text" autocomplete="off" placeholder="Escreva sua mensagem…">
        <button class="ep-bot__send" type="submit" aria-label="Enviar">→</button>
      </form>
    </div>
    <button class="ep-bot__toggle" type="button" aria-label="Abrir assistente">✦</button>
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
    input: root.querySelector(".ep-bot__input")
  };

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

  els.toggle.addEventListener("click", () => {
    root.classList.add("is-open");
    if (!state.started) {
      state.started = true;
      setTimeout(greeting, 120);
    }
    els.input.focus();
  });
  els.close.addEventListener("click", () => root.classList.remove("is-open"));
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
