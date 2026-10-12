import test from "node:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";
import { paginaHtml, validarSlugsUnicos } from "../gerar-paginas-tratamentos.mjs";
import { resumir, tituloSeo, sincronizarPastas, paginaRedirecionamento } from "../lib/conteudo.mjs";
import { paginaHtml as paginaArtigoHtml } from "../gerar-paginas-artigos.mjs";
import { paginaHtml as paginaResultadoHtml } from "../gerar-paginas-resultados.mjs";

test("página de redirecionamento antigo é noindex e aponta ao canonical de destino", () => {
  const destino = "https://www.especialistaempele.com.br/blog/novo-slug.html";
  const html = paginaRedirecionamento("BLOG-TESTE-000001", destino);
  assert.ok(html.includes('<meta name="robots" content="noindex,follow">'));
  assert.ok(html.includes('<meta name="conteudo-movido-para" content="' + destino + '">'));
  assert.ok(html.includes('<link rel="canonical" href="' + destino + '">'));
});

test("gerador bloqueia slugs de tratamentos duplicados após normalização", () => {
  assert.throws(
    () => validarSlugsUnicos([
      { id: 101, slug: "acne-hormonal" },
      { id: 202, slug: "Acne hormonal" },
    ]),
    /Slug de tratamento duplicado após normalização "acne-hormonal".*101.*202/
  );
  assert.doesNotThrow(() => validarSlugsUnicos([
    { id: 101, slug: "acne-hormonal" },
    { id: 202, slug: "melasma" },
  ]));
});

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

test("título SEO não acrescenta marca quando ultrapassa o limite, sem truncar o título editorial", () => {
  const longo = "Por que a acne persiste mesmo com cuidados adequados";
  assert.equal(tituloSeo(longo), longo);
  assert.equal(tituloSeo("Acne e saúde da pele"), "Acne e saúde da pele — Especialista em Pele");
});

test("artigo sem capa usa imagem alternativa visível e metadados de compartilhamento", () => {
  const html = paginaArtigoHtml({
    public_id: "TEST-SEO-000004",
    slug: "artigo-sem-capa",
    title: "Artigo sem capa",
    excerpt: "Conteúdo de teste.",
    content: "Conteúdo de teste.",
    published_at: null,
    updated_at: null,
    cover_image_url: "",
    treatments: null,
  });
  const fallback = "https://www.especialistaempele.com.br/assets/hero-fallback.webp";
  assert.ok(html.includes('<img src="' + fallback + '" alt="Imagem ilustrativa sobre saúde da pele — Artigo sem capa"'));
  assert.ok(html.includes('<meta property="og:image" content="' + fallback + '">'));
  assert.ok(html.includes('<meta name="twitter:image" content="' + fallback + '">'));
});

test("gerador de artigos mantém title, Open Graph e Twitter alinhados", () => {
  const titulo = "Por que a acne persiste mesmo com cuidados adequados";
  const html = paginaArtigoHtml({
    public_id: "TEST-SEO-000002",
    slug: "artigo-teste-seo",
    title: titulo,
    excerpt: "Conteúdo educativo sobre acne.",
    content: "Conteúdo de teste.",
    published_at: null,
    updated_at: null,
    cover_image_url: "",
    treatments: null,
  });
  assert.ok(html.includes("<title>" + titulo + "</title>"));
  assert.ok(html.includes('<meta property="og:title" content="' + titulo + '">'));
  assert.ok(html.includes('<meta name="twitter:title" content="' + titulo + '">'));
});

test("gerador de resultados mantém o título SEO conciso e os metadados alinhados", () => {
  const titulo = "Evolução do aspecto da pele após acompanhamento individualizado";
  const html = paginaResultadoHtml({
    public_id: "TEST-SEO-000003",
    slug: "resultado-teste-seo",
    title: titulo,
    description: "Registro de evolução individual; resultados variam entre pessoas.",
    content: "Descrição de teste.",
    published_at: null,
    created_at: null,
    updated_at: null,
    treatments: null,
    before_image_url: "",
    after_image_url: "",
    extras: [],
  }, { fotos: [], dims: new Map(), outros: [] });
  const titleSeo = titulo + " — Resultado real";
  assert.ok(html.includes("<title>" + titleSeo + "</title>"));
  assert.ok(html.includes('<meta property="og:title" content="' + titleSeo + '">'));
  assert.ok(html.includes('<meta name="twitter:title" content="' + titleSeo + '">'));
  assert.ok(!html.includes(titleSeo + " — Especialista em Pele"), "marca não deve alongar ainda mais o título");
});

test("sincronização não apaga páginas geradas quando a lista de publicados vem vazia", () => {
  const originalCwd = process.cwd();
  const originalOverride = process.env.ALLOW_EMPTY_PUBLICATION_SYNC;
  const temp = mkdtempSync(join(tmpdir(), "seo-sync-"));
  try {
    process.chdir(temp);
    mkdirSync("blog", { recursive: true });
    writeFileSync("blog/artigo-existente.html", '<meta name="conteudo-id" content="BLOG-TESTE">');
    delete process.env.ALLOW_EMPTY_PUBLICATION_SYNC;
    assert.throws(
      () => sincronizarPastas({ pastas: ["blog"], urlBase: "https://example.com/blog", itens: [], log: () => {} }),
      /Sincronização abortada/
    );
  } finally {
    process.chdir(originalCwd);
    rmSync(temp, { recursive: true, force: true });
    if (originalOverride === undefined) delete process.env.ALLOW_EMPTY_PUBLICATION_SYNC;
    else process.env.ALLOW_EMPTY_PUBLICATION_SYNC = originalOverride;
  }
});
