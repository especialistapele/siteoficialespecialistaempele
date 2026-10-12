import test from "node:test";
import assert from "node:assert/strict";
import { paginaGerada } from "../lib/manifesto.mjs";

test("manifesto identifica apenas marcadores específicos ou páginas com ID estável", () => {
  assert.equal(paginaGerada("<!-- AUTO-GENERATED:TREATMENT-PAGE -->"), true);
  assert.equal(paginaGerada('<meta name="conteudo-id" content="BLOG-000001">', "BLOG-000001"), true);
  assert.equal(paginaGerada("<!-- AUTO-GENERATED: -->"), false);
  assert.equal(paginaGerada("<html><body>Página manual de SEO</body></html>"), false);
});
