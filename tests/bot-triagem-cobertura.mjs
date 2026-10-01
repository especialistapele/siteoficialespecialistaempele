import fs from "node:fs";

const treatmentDir = "tratamentos";
const pages = fs.readdirSync(treatmentDir).filter((name) => name.endsWith(".html") && name !== "index.html");
const config = fs.readFileSync("assets/js/bot-config.js", "utf8");

const missingConfig = pages.map((name) => "/tratamentos/" + name).filter((route) => !config.includes(""" + route + """));
const missingLoader = pages.filter((name) => {
  const html = fs.readFileSync(treatmentDir + "/" + name, "utf8");
  return !html.includes("assets/js/whatsapp.js") || !html.includes("data-whatsapp-link");
});

if (missingConfig.length || missingLoader.length) {
  if (missingConfig.length) {
    console.error("Páginas sem contexto no bot:");
    missingConfig.forEach((x) => console.error("- " + x));
  }
  if (missingLoader.length) {
    console.error("Páginas sem carregamento do bot/WhatsApp:");
    missingLoader.forEach((x) => console.error("- tratamentos/" + x));
  }
  process.exit(1);
}

console.log("OK: " + pages.length + " páginas de tratamento possuem integração com o bot.");