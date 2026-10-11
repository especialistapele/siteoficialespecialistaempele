import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sharedContent = readFileSync("scripts/lib/conteudo.mjs", "utf8");
const treatmentGenerator = readFileSync("scripts/gerar-paginas-tratamentos.mjs", "utf8");
const articleGenerator = readFileSync("scripts/gerar-paginas-artigos.mjs", "utf8");
const resultsGenerator = readFileSync("scripts/gerar-paginas-resultados.mjs", "utf8");

assert.ok(sharedContent.includes('return u.protocol === "https:" ? u.href : "";'), "URLs absolutas geradas devem exigir HTTPS");
assert.ok(!sharedContent.includes('u.protocol === "https:" || u.protocol === "http:"'), "URLs HTTP externas não devem passar pelo helper");
assert.ok(sharedContent.includes('!raw.startsWith("//")'), "URLs relativas não devem aceitar protocol-relative");
assert.ok(sharedContent.includes("String.fromCharCode(92)"), "URLs relativas devem rejeitar barra invertida");

assert.ok(treatmentGenerator.includes('import { urlSegura, renderizarConteudo } from "./lib/conteudo.mjs";'), "gerador de tratamentos deve usar helpers compartilhados");
assert.ok(treatmentGenerator.includes("const imagem = urlSegura(t.cover_image_url);"), "imagem de tratamento deve ser validada");
assert.ok(treatmentGenerator.includes('const ctaUrl = t.cta_url ? urlSegura(t.cta_url, { relativa: true }) : "";'), "CTA de tratamento deve ser validado");
assert.ok(treatmentGenerator.includes('renderizarConteudo(t.description || t.summary || "")'), "HTML rico do tratamento deve ser sanitizado antes de gerar página");
assert.doesNotMatch(treatmentGenerator, /renderizarOrientacao\(|src="\$\{escapeHtml\(t\.cover_image_url\)\}"/, "gerador não deve emitir descrição ou URL de imagem sem sanitização/validação");

assert.ok(articleGenerator.includes('const ctaUrl = a.cta_url ? urlSegura(a.cta_url, { relativa: true }) : "";'), "CTA de artigo deve ser validado");
assert.ok(articleGenerator.includes('renderizarConteudo(a.content || "")'), "conteúdo de artigo deve ser sanitizado");
assert.ok(resultsGenerator.includes("urlSegura(r.before_image_url)"), "imagens de resultados devem ser validadas");
assert.ok(resultsGenerator.includes("renderizarConteudo"), "descrições HTML de resultados devem passar pelo sanitizador compartilhado");

console.log("Segurança estática da publicação: OK — URLs HTTPS, CTAs e HTML rico nas páginas estáticas.");
