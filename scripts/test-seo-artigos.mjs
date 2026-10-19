import assert from "node:assert/strict";
import { sanitizarHtmlRico, hrefSeguroHtml } from "./lib/conteudo.mjs";
import { paginaHtml } from "./gerar-paginas-artigos.mjs";

// Segurança de links: somente HTTP(S), caminhos internos e âncoras.
assert.equal(hrefSeguroHtml("javascript:alert(1)"), "");
assert.equal(hrefSeguroHtml("data:text/html,teste"), "");
assert.equal(hrefSeguroHtml("//evil.example/path"), "");
assert.equal(hrefSeguroHtml("/tratamentos/acne.html"), "/tratamentos/acne.html");
assert.equal(hrefSeguroHtml("#perguntas"), "#perguntas");
assert.match(hrefSeguroHtml("https://example.org/fonte"), /^https:\/\//);

// O sanitizador mantém links úteis, mas remove atributos executáveis e protocolos perigosos.
const rico = sanitizarHtmlRico(
  '<p>Referência: <a href="https://example.org/artigo" onclick="alert(1)" target="_blank">fonte científica</a>; ' +
  '<a href="javascript:alert(1)">link inválido</a></p><script>alert(2)</script>'
);
assert.match(rico, /<a href="https:\/\/example\.org\/artigo">fonte científica<\/a>/);
assert.doesNotMatch(rico, /onclick|target=|javascript:|<script/i);

// Teste de regressão do HTML gerado: metadados, canonical, schema e link interno.
const pagina = paginaHtml({
  id: 17,
  public_id: "BLOG-000017",
  slug: "teste-seo-artigo",
  title: "Barreira cutânea: sinais e cuidados",
  excerpt: "Entenda os sinais de uma barreira cutânea fragilizada e os cuidados para apoiar a recuperação da pele.",
  content: '<p>Consulte <a href="https://example.org/referencia">esta referência</a>.</p>',
  cover_image_url: null,
  published_at: "2026-12-08T12:00:00.000Z",
  updated_at: "2026-12-08T12:00:00.000Z",
  faq: [{ pergunta: "Quando procurar avaliação?", resposta: "Quando os sintomas persistirem." }],
});
assert.match(pagina, /<title>Barreira cutânea: sinais e cuidados<\/title>/);
assert.match(pagina, /<meta name="description" content="Entenda os sinais/);
assert.match(pagina, /<link rel="canonical" href="https:\/\/www\.especialistaempele\.com\.br\/blog\/teste-seo-artigo\.html">/);
assert.match(pagina, /"@type":"Article"/);
assert.match(pagina, /"@type":"FAQPage"/);
assert.match(pagina, /<a href="https:\/\/example\.org\/referencia">esta referência<\/a>/);
assert.match(pagina, /<meta name="conteudo-id" content="BLOG-000017">/);

console.log("SEO artigos: sanitização de links, segurança e HTML gerado passaram.");
