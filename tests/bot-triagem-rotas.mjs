import fs from "node:fs";
import assert from "node:assert/strict";

const config = fs.readFileSync("assets/js/bot-config.js", "utf8");
const contextBlock = config.match(/pageContexts:\s*\{([\s\S]*?)\n\s*\},\n\s*greetings:/)?.[1];

assert.ok(contextBlock, "Não foi possível localizar pageContexts no bot-config.js");

const routes = [...contextBlock.matchAll(/"([^"]+)":\s*"[^"]+"/g)]
  .map((match) => match[1])
  .filter((route) => route.startsWith("/tratamentos/"));

assert.ok(routes.length > 0, "Nenhuma rota de tratamento foi encontrada em pageContexts");

const missing = routes.filter((route) => !fs.existsSync("." + route));

if (missing.length) {
  console.error("Rotas de tratamento ausentes:");
  for (const route of missing) console.error("- " + route);
  process.exit(1);
}

console.log("OK: " + routes.length + " rotas de tratamento do bot existem na branch.");