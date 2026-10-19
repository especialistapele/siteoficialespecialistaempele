import assert from "node:assert/strict";
import { paginaHtml } from "./gerar-paginas-artigos.mjs";

const pagina = paginaHtml({
  id: 17,
  public_id: "BLOG-000017",
  slug: "barreira-cutanea-danificada",
  title: "Barreira Cutânea Danificada: Sinais e Como Recuperar a Proteção da Pele",
  excerpt: "Conheça sinais de uma barreira cutânea danificada e cuidados para apoiar a recuperação da pele.",
  content: "<p>Conteúdo educativo.</p>",
  cover_image_url: "https://www.especialistaempele.com.br/assets/blog-covers/barreira-cutanea-danificada.svg",
  published_at: "2026-12-08T12:00:00.000Z",
  updated_at: "2026-12-08T12:00:00.000Z",
  faq: [],
});
assert.match(pagina, /alt="Ilustração das camadas protetoras da pele e de um escudo, representando a barreira cutânea\."/);
console.log("Alt descritivo da capa: aprovado.");
