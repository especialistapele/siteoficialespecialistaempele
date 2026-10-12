// Detecta diretivas robots noindex sem depender da ordem dos atributos HTML.
export function temNoindex(html) {
  const tags = String(html ?? "").match(/<meta\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const atributos = {};
    for (const match of tag.matchAll(/([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
      atributos[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? "";
    }
    if (atributos.name?.trim().toLowerCase() !== "robots") continue;
    const diretivas = (atributos.content || "").toLowerCase().split(/[\s,]+/);
    if (diretivas.includes("noindex")) return true;
  }
  return false;
}
