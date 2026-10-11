import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { sincronizarPastas, slugifyUrl, urlSegura } from "../scripts/lib/conteudo.mjs";

const sharedContent = readFileSync("scripts/lib/conteudo.mjs", "utf8");
const treatmentGenerator = readFileSync("scripts/gerar-paginas-tratamentos.mjs", "utf8");
const articleGenerator = readFileSync("scripts/gerar-paginas-artigos.mjs", "utf8");
const resultsGenerator = readFileSync("scripts/gerar-paginas-resultados.mjs", "utf8");

assert.ok(sharedContent.includes('return u.protocol === "https:" ? u.href : "";'), "URLs absolutas geradas devem exigir HTTPS");
assert.ok(!sharedContent.includes('u.protocol === "https:" || u.protocol === "http:"'), "URLs HTTP externas não devem passar pelo helper");
assert.ok(sharedContent.includes('!raw.startsWith("//")'), "URLs relativas não devem aceitar protocol-relative");
assert.ok(sharedContent.includes("String.fromCharCode(92)"), "URLs relativas devem rejeitar barra invertida");
assert.equal(urlSegura("http://example.test/image.webp"), "", "URLs HTTP externas devem ser rejeitadas");
assert.equal(urlSegura("//example.test/image.webp"), "", "URLs protocol-relative devem ser rejeitadas");
assert.equal(urlSegura("/assets/image.webp", { relativa: true }), "/assets/image.webp", "caminhos locais à raiz devem continuar permitidos");
assert.equal(slugifyUrl("../outside"), "outside", "slug não pode carregar segmentos de caminho");

assert.ok(treatmentGenerator.includes('import { urlSegura, renderizarConteudo } from "./lib/conteudo.mjs";'), "gerador de tratamentos deve usar helpers compartilhados");
assert.ok(treatmentGenerator.includes("const imagem = urlSegura(t.cover_image_url);"), "imagem de tratamento deve ser validada");
assert.ok(treatmentGenerator.includes('const ctaUrl = t.cta_url ? urlSegura(t.cta_url, { relativa: true }) : "";'), "CTA de tratamento deve ser validado");
assert.ok(treatmentGenerator.includes('renderizarConteudo(t.description || t.summary || "")'), "HTML rico do tratamento deve ser sanitizado antes de gerar página");
assert.doesNotMatch(treatmentGenerator, /renderizarOrientacao\(|src="\$\{escapeHtml\(t\.cover_image_url\)\}"/, "gerador não deve emitir descrição ou URL de imagem sem sanitização/validação");

assert.ok(articleGenerator.includes('const ctaUrl = a.cta_url ? urlSegura(a.cta_url, { relativa: true }) : "";'), "CTA de artigo deve ser validado");
assert.ok(articleGenerator.includes('renderizarConteudo(a.content || "")'), "conteúdo de artigo deve ser sanitizado");
assert.ok(resultsGenerator.includes("urlSegura(r.before_image_url)"), "imagens de resultados devem ser validadas");
assert.ok(resultsGenerator.includes("renderizarConteudo"), "descrições HTML de resultados devem passar pelo sanitizador compartilhado");

const tempRoot = mkdtempSync(join(tmpdir(), "publication-content-security-"));
try {
  const output = join(tempRoot, "blog");
  const outside = join(tempRoot, "outside.html");
  const report = sincronizarPastas({
    pastas: [output],
    urlBase: "https://example.test/blog",
    itens: [{ id: "BLOG-TEST", slug: "../outside", html: '<!doctype html><meta name="conteudo-id" content="BLOG-TEST"><p>safe</p>' }],
    log: () => {},
  });
  assert.equal(report.criadas.length, 1, "a página com slug normalizado deve ser criada");
  assert.equal(existsSync(join(output, "outside.html")), true, "página deve ficar dentro da pasta de saída");
  assert.equal(existsSync(outside), false, "slug malicioso não pode escrever fora da pasta de saída");
  assert.throws(() => sincronizarPastas({
    pastas: [output],
    urlBase: "https://example.test/blog",
    itens: [
      { id: "BLOG-A", slug: "outside", html: "a" },
      { id: "BLOG-B", slug: "../outside", html: "b" },
    ],
    log: () => {},
  }), /Slug duplicado/, "colisão de slugs normalizados deve interromper a publicação");
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}

console.log("Segurança da publicação: OK — URLs, HTML rico e caminhos de saída testados.");
