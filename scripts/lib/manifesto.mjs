// Regras explícitas para identificar páginas geradas no manifesto estático.
// Páginas manuais são preservadas salvo se tiverem um marcador específico ou ID.
export function paginaGerada(html, id = null) {
  return /AUTO-GENERATED:TREATMENT-PAGE/i.test(String(html ?? "")) || Boolean(id);
}
