import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const sitemap = readFileSync(join(root, "sitemap.xml"), "utf8");
const whatsapp = readFileSync(join(root, "assets/js/whatsapp.js"), "utf8");

const pages = [
  { path: "acne-araruama.html", key: "local-acne-araruama", treatment: "acne" },
  { path: "acne-cabo-frio-riviera.html", key: "local-acne-cabofrio-riviera", treatment: "acne" },
  { path: "acne-copacabana.html", key: "local-acne-copacabana", treatment: "acne" },
  { path: "melasma-araruama.html", key: "local-melasma-araruama", treatment: "melasma" },
  { path: "melasma-cabo-frio-riviera.html", key: "local-melasma-cabofrio-riviera", treatment: "melasma" },
  { path: "melasma-copacabana.html", key: "local-melasma-copacabana", treatment: "melasma" },
  { path: "rosacea-araruama.html", key: "local-rosacea-araruama", treatment: "rosacea" },
  { path: "rosacea-cabo-frio-riviera.html", key: "local-rosacea-cabofrio-riviera", treatment: "rosacea" },
  { path: "rosacea-copacabana.html", key: "local-rosacea-copacabana", treatment: "rosacea" },
];

const getMeta = (html, pattern) => html.match(pattern)?.[1] ?? "";
for (const page of pages) {
  const html = readFileSync(join(root, page.path), "utf8");
  const title = getMeta(html, /<title>([^<]*)<\/title>/i);
  const description = getMeta(html, /<meta name="description" content="([^"]*)"/i);
  const canonical = getMeta(html, /<link rel="canonical" href="([^"]*)"/i);
  const ogTitle = getMeta(html, /<meta property="og:title" content="([^"]*)"/i);
  const ogDescription = getMeta(html, /<meta property="og:description" content="([^"]*)"/i);
  const twitterTitle = getMeta(html, /<meta name="twitter:title" content="([^"]*)"/i);
  const twitterDescription = getMeta(html, /<meta name="twitter:description" content="([^"]*)"/i);
  const pageKey = getMeta(html, /<body[^>]*data-pagina="([^"]+)"/i);
  const h1Count = (html.match(/<h1\b/gi) ?? []).length;
  const expectedUrl = "https://www.especialistaempele.com.br/" + page.path;

  assert.ok(title, page.path + ": title ausente");
  assert.ok(description, page.path + ": meta description ausente");
  assert.ok(description.length <= 160, page.path + ": descrição excede 160 caracteres (" + description.length + ")");
  assert.equal(canonical, expectedUrl, page.path + ": canonical incorreta");
  assert.equal(ogTitle, title, page.path + ": og:title divergente");
  assert.equal(twitterTitle, title, page.path + ": twitter:title divergente");
  assert.equal(ogDescription, description, page.path + ": og:description divergente");
  assert.equal(twitterDescription, description, page.path + ": twitter:description divergente");
  assert.equal(h1Count, 1, page.path + ": esperado exatamente um H1");
  assert.equal(pageKey, page.key, page.path + ": data-pagina inesperado");
  assert.ok(whatsapp.includes('"' + page.key + '":'), page.path + ": mensagem WhatsApp específica ausente");
  assert.ok(html.includes('href="/tratamentos/' + page.treatment + '.html"'), page.path + ": link para tratamento ausente");
  assert.ok(sitemap.includes("<loc>" + expectedUrl + "</loc>"), page.path + ": URL ausente no sitemap");
  assert.ok(!/Em até 1h/i.test(html), page.path + ": contém prazo de resposta não verificado");
  assert.ok(!/acompanhados em (Araruama|Cabo Frio|Copacabana)/i.test(html), page.path + ": atribui resultados à unidade sem comprovação");
}

console.log("SEO local: " + pages.length + " páginas verificadas; metadados, canonical, sitemap, links e mensagens WhatsApp OK.");
