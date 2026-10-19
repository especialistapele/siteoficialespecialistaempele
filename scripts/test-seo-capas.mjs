import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const capas = [
  "barreira-cutanea-danificada",
  "como-escolher-protetor-solar-para-melasma",
  "rotina-skincare-pele-adulta",
  "pele-apos-35-anos",
  "niacinamida-vitamina-c-acido-hialuronico",
  "bakuchiol-beneficios-evidencias",
  "pele-sensivel-ou-rosacea",
  "cicatrizes-de-acne-manchas-marcas",
  "resveratrol-na-pele",
  "erros-na-rotina-de-skincare",
  "pele-seca-ou-desidratada",
];
for (const slug of capas) {
  const path = join(process.cwd(), "assets", "blog-covers", `${slug}.svg`);
  assert.equal(existsSync(path), true, `Capa ausente: ${slug}`);
  const svg = readFileSync(path, "utf8");
  assert.match(svg, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(svg, /<svg[^>]+viewBox="0 0 1200 675"/);
  assert.match(svg, /<title id="title">[^<]+<\/title>/);
  assert.match(svg, /<desc id="desc">[^<]+<\/desc>/);
  assert.doesNotMatch(svg, /<(?:image|script)\b|(?:href|src)=["']https?:|url\(https?:/i, `Capa deve ser independente: ${slug}`);
}
console.log(`Capas editoriais: ${capas.length} SVGs próprios passaram nas verificações estruturais.`);
