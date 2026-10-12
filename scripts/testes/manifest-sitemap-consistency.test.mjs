import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve, sep } from "node:path";

const root = process.cwd();
const sitemap = readFileSync(resolve(root, "sitemap.xml"), "utf8");
const manifest = JSON.parse(readFileSync(resolve(root, "publicacao-manifest.json"), "utf8"));
const siteOrigin = new URL(manifest.site).origin;

function caminhoDoUrl(urlString) {
  const url = new URL(urlString);
  assert.equal(url.origin, siteOrigin, \`URL fora do domínio principal no sitemap: \${urlString}\`);
  let caminho = decodeURIComponent(url.pathname).replace(/^\/+/, "");
  if (!caminho || caminho.endsWith("/")) caminho += "index.html";
  const absoluto = resolve(root, caminho);
  assert.ok(
    absoluto === root || absoluto.startsWith(root + sep),
    \`Caminho fora do repositório: \${urlString}\`
  );
  return { caminho, absoluto };
}

function urlsDoSitemap() {
  return [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1].trim());
}

test("sitemap não tem URLs duplicadas e aponta apenas para páginas locais existentes", () => {
  const urls = urlsDoSitemap();
  assert.ok(urls.length > 0, "sitemap.xml não contém URLs");
  assert.equal(new Set(urls).size, urls.length, "sitemap.xml contém URLs duplicadas");

  for (const url of urls) {
    const { absoluto } = caminhoDoUrl(url);
    assert.ok(existsSync(absoluto), \`URL do sitemap sem arquivo publicado: \${url}\`);
  }
});

test("todas as páginas publicadas no manifesto e com HTTP 200 estão no sitemap", () => {
  const caminhosNoSitemap = new Set(urlsDoSitemap().map((url) => caminhoDoUrl(url).caminho));
  const publicados = manifest.items.filter(
    (item) => item.status === "published" && item.http_status === 200
  );

  assert.ok(publicados.length > 0, "manifesto não contém páginas publicadas para validar");

  for (const item of publicados) {
    const arquivo = resolve(root, item.path);
    assert.ok(existsSync(arquivo), \`Arquivo do manifesto não existe: \${item.path}\`);
    assert.ok(
      caminhosNoSitemap.has(item.path),
      \`Página publicada ausente do sitemap: \${item.path}\`
    );
  }
});
