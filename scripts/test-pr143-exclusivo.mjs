import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { paragrafar, renderizarConteudo } from "./lib/conteudo.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const artigos = readFileSync(resolve(root, "scripts/gerar-paginas-artigos.mjs"), "utf8");
const resultados = readFileSync(resolve(root, "scripts/gerar-paginas-resultados.mjs"), "utf8");

for (const slug of ["controle-da-oleosidade","como-escolher-um-tratamento-para-melasma","rejuvenescimento-facial-ou-harmonizacao","o-que-e-regeneracao-cutanea","por-que-a-acne-persiste"]) assert.ok(artigos.includes('"'+slug+'"'), 'SEO de artigo ausente: '+slug);
for (const slug of ["resultado-de-limpeza-de-pele-nanotecnologica-caso-01","resultado-de-limpeza-de-pele-nanotecnologica-caso-02","resultado-de-limpeza-de-pele-nanotecnologica-caso-03","resultado-de-limpeza-de-pele-nanotecnologica-caso-04","resultado-de-limpeza-de-pele-nanotecnologica-caso-05","resultado-de-limpeza-de-pele-nanotecnologica-caso-06","resultado-de-limpeza-de-pele-nanotecnologica-caso-07","resultado-de-limpeza-de-pele-nanotecnologica-caso-08","resultado-de-limpeza-de-pele-nanotecnologica-caso-09","mancha-solar","poros-dilatados","rejuvenescimento-de-colo","remocao-de-nigras01","resultado-com-mais-de-2-meses-de-tratamento"]) assert.ok(resultados.includes('"'+slug+'"'), 'SEO de resultado ausente: '+slug);

const markdown = paragrafar("# Título\n\nTexto **forte** e *ênfase*.\n\n- primeiro item\n- segundo item");
assert.match(markdown, /<h2>Título<\/h2>/);
assert.match(markdown, /<strong>forte<\/strong>/);
assert.match(markdown, /<em>ênfase<\/em>/);
assert.match(markdown, /<ul><li>primeiro item<\/li><li>segundo item<\/li><\/ul>/);

const misto = renderizarConteudo("<p>Conteúdo **destacado** e _enfatizado_.</p>");
assert.match(misto, /<strong>destacado<\/strong>/);
assert.match(misto, /<em>enfatizado<\/em>/);
assert.doesNotMatch(misto, /<script|onerror\s*=/i);
console.log("SEO exclusivo do PR #143 e renderização Markdown: aprovado.");
