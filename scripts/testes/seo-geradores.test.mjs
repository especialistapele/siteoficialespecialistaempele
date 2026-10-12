import test from "node:test";
import assert from "node:assert/strict";
import { paginaHtml } from "../gerar-paginas-tratamentos.mjs";
import { resumir } from "../lib/conteudo.mjs";

test("meta description de tratamento termina em limite de palavra e sincroniza metadados", () => {
  const summary = "Cuidados individualizados para a saúde da pele, com avaliação das necessidades, orientações sobre ativos cosméticos, rotina domiciliar e acompanhamento responsável para diferentes condições cutâneas. A abordagem considera histórico, objetivos e tolerância da pele.";
  const html = paginaHtml({
    public_id: "TEST-SEO-000001",
    slug: "tratamento-teste-seo",
    name: "Tratamento de teste SEO",
    summary,
    description: "",
    cover_image_url: "",
  });
  const expected = resumir(summary, 155);
  assert.ok(expected.length <= 155, "descrição deve respeitar o limite configurado");
  assert.ok(expected.endsWith("…"), "descrição longa deve indicar o corte");
  assert.match(html, new RegExp('<meta name="description" content="' + expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + '">'));
  assert.ok(html.includes('<meta property="og:description" content="' + expected + '">'));
  assert.ok(html.includes('<meta name="twitter:description" content="' + expected + '">'));
  assert.ok(html.includes('description":"' + expected + '"'), "Schema.org deve usar a mesma descrição");
});
