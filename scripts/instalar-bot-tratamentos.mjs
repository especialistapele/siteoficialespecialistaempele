import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, "assets/js/bot-tratamentos-auto.js");
const TREATMENT_DIR = path.join(ROOT, "tratamentos");

function escapeJs(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, " ");
}

function slugToContext(slug) {
  return String(slug || "")
    .replace(/\.html$/i, "")
    .trim()
    .toLowerCase();
}

function extract(html, regex) {
  const match = html.match(regex);
  return match ? match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "";
}

const CANONICAL_CONTEXT_BY_SLUG = {
  "cicatriz": "cicatrizes",
  "clareamento": "clareamento-corporal",
  "corporal": "gordura-localizada",
  "definicao": "definicao-corporal",
  "melasma": "manchas",
  "poros-abertos": "poros"
};

const files = fs.readdirSync(TREATMENT_DIR)
  .filter((file) => file.endsWith(".html") && file !== "index.html")
  .sort();

const treatmentModes = {};
const pageContexts = {};
const greetings = {};
const labels = {};
const aliases = {};

for (const file of files) {
  const html = fs.readFileSync(path.join(TREATMENT_DIR, file), "utf8");
  const slug = slugToContext(file);
  const marker = html.match(/AUTO-GENERATED:TREATMENT-PAGE[^>]*slug=([^\s>]+)/i);
  const context = CANONICAL_CONTEXT_BY_SLUG[slug] || marker?.[1] || slug;
  const name = extract(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i) || context;

  pageContexts["/tratamentos/" + file] = context;
  treatmentModes[context] = { presential: true, online: false };
  greetings[context] = "Vi que você está conhecendo nosso conteúdo sobre " + name + ". O que você gostaria de entender melhor?";
  labels[context] = name;
  aliases[context] = [name, slug.replace(/-/g, " ")];
}

const output = `// AUTO-GENERATED — não editar manualmente.
// Gerado por scripts/instalar-bot-tratamentos.mjs a partir das páginas
// publicadas em /tratamentos. Regras especiais continuam em bot-config.js.

window.ESPECIALISTA_PELE_BOT_AUTO = {
  treatmentModes: ${JSON.stringify(treatmentModes, null, 2)},
  pageContexts: ${JSON.stringify(pageContexts, null, 2)},
  greetings: ${JSON.stringify(greetings, null, 2)},
  labels: ${JSON.stringify(labels, null, 2)},
  aliases: ${JSON.stringify(aliases, null, 2)}
};
`;

fs.writeFileSync(OUTPUT, output, "utf8");
console.log("INSTALADOR DO BOT: manifesto automático gerado.");
console.log("Páginas de tratamento:", files.length);
console.log("Arquivo:", OUTPUT);
