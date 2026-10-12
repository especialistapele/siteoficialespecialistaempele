// Utilitários de metadados HTML usados pelos geradores e validadores SEO.
export function atributosTag(tag) {
  const atributos = {};
  for (const match of String(tag ?? "").matchAll(/([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    atributos[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? "";
  }
  return atributos;
}

export function obterMeta(html, nome) {
  const tags = String(html ?? "").match(/<meta\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const attrs = atributosTag(tag);
    if (attrs.name?.trim().toLowerCase() === String(nome).trim().toLowerCase()) return attrs;
  }
  return null;
}

export function obterCanonical(html) {
  const tags = String(html ?? "").match(/<link\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const attrs = atributosTag(tag);
    if ((attrs.rel || "").toLowerCase().split(/\s+/).includes("canonical")) return attrs.href || null;
  }
  return null;
}

export function temNoindex(html) {
  const content = obterMeta(html, "robots")?.content || "";
  return content.toLowerCase().split(/[\s,]+/).includes("noindex");
}
