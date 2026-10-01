import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const treatmentPath = path.join(ROOT, "tratamentos", "__teste-instalador-automatico.html");
const manifestPath = path.join(ROOT, "assets/js/bot-tratamentos-auto.js");

const html = `<!doctype html>
<html lang="pt-BR">
<head><title>Tratamento teste do instalador</title></head>
<body data-pagina="tratamento">
  <main><h1>Tratamento Teste do Instalador</h1></main>
  <script src="/assets/js/whatsapp.js"></script>
</body>
</html>`;

try {
  fs.writeFileSync(treatmentPath, html, "utf8");
  execFileSync(process.execPath, ["scripts/instalar-bot-tratamentos.mjs"], { cwd: ROOT, stdio: "pipe" });

  const manifest = fs.readFileSync(manifestPath, "utf8");
  const required = [
    '"/tratamentos/__teste-instalador-automatico.html": "__teste-instalador-automatico"',
    '"__teste-instalador-automatico": {',
    '"presential": true',
    '"online": false',
    "Tratamento Teste do Instalador",
  ];

  for (const fragment of required) {
    if (!manifest.includes(fragment)) {
      throw new Error("Manifesto não registrou o novo tratamento: " + fragment);
    }
  }

  console.log("Instalador automático: OK — nova página de tratamento gerou contexto, modalidade, greeting, label e alias.");
} finally {
  if (fs.existsSync(treatmentPath)) fs.unlinkSync(treatmentPath);
  execFileSync(process.execPath, ["scripts/instalar-bot-tratamentos.mjs"], { cwd: ROOT, stdio: "pipe" });
}
