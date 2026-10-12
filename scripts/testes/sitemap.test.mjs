import test from "node:test";
import assert from "node:assert/strict";
import { temNoindex } from "../lib/sitemap.mjs";

test("detecta noindex quando name aparece antes de content", () => {
  assert.equal(temNoindex('<meta name="robots" content="noindex,follow">'), true);
});

test("detecta noindex quando content aparece antes de name", () => {
  assert.equal(temNoindex('<meta content="noindex,follow" name="robots">'), true);
});

test("detecta noindex sem diferenciar maiúsculas e espaços", () => {
  assert.equal(temNoindex('<META content="index, NOINDEX" name="ROBOTS">'), true);
});

test("não confunde nofollow ou noarchive com noindex", () => {
  assert.equal(temNoindex('<meta name="robots" content="nofollow,noarchive">'), false);
});

test("ignora meta tags que não são diretivas robots", () => {
  assert.equal(temNoindex('<meta name="description" content="noindex">'), false);
  assert.equal(temNoindex(""), false);
});

test("extrai metadados mesmo quando os atributos estão em outra ordem", async () => {
  const { obterMeta, obterCanonical } = await import("../lib/sitemap.mjs");
  const html = '<META content="ID-123" name="conteudo-id"><link href="https://www.especialistaempele.com.br/pagina/" rel="alternate canonical">';
  assert.equal(obterMeta(html, "conteudo-id").content, "ID-123");
  assert.equal(obterCanonical(html), "https://www.especialistaempele.com.br/pagina/");
});

test("aceita aspas simples e diferenças entre maiúsculas e minúsculas", async () => {
  const { obterMeta, obterCanonical } = await import("../lib/sitemap.mjs");
  assert.equal(obterMeta("<META CONTENT='noindex' NAME='ROBOTS'>", "robots").content, "noindex");
  assert.equal(obterCanonical("<LINK HREF='https://example.com/' REL='canonical'>"), "https://example.com/");
});
