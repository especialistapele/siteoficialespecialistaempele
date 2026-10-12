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
