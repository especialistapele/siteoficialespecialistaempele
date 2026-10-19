// ============================================================
// Gera UMA página HTML estática por resultado publicado, em
// /resultados/<slug>.html (buscados direto no Supabase), no mesmo
// esquema de scripts/gerar-paginas-tratamentos.mjs.
//
//   1 resultado publicado (com consentimento) = 1 página estática.
//
// Todas as fotos do resultado entram na página: antes, depois e
// as extras cadastradas em result_images. Cada foto sai com URL
// acessível, alt descritivo, width/height, loading otimizado,
// legenda e ImageObject no Schema.org (Google Imagens).
//
// Despublicado / consentimento revogado / excluído -> a página é
// apagada (404). Slug alterado -> a URL antiga vira redirecionamento.
// A listagem estática de /resultados/ também é atualizada aqui.
//
//   SUPABASE_URL=... SUPABASE_ANON_KEY=... node scripts/gerar-paginas-resultados.mjs
// ============================================================

import {
  SITE, SUPABASE_ANON_KEY, slugifyUrl, escapeHtml, dataBR, dataISO, urlSegura, renderizarConteudo,
  textoPuro, resumir, tituloSeo, buscar, dimensoesImagem, attrDim, cabecalho, rodape, marcadorId,
  sincronizarPastas, injetarLista,
} from "./lib/conteudo.mjs";

export { slugifyUrl };

const PASTA = "resultados";
const EDITORA = {
  "@type": "Organization", name: "Especialista em Pele", url: `${SITE}/`,
  logo: { "@type": "ImageObject", url: `${SITE}/assets/logo-especialista.webp` },
};
const AVISO = "Imagem publicada com consentimento expresso da paciente. Os resultados variam de pessoa para pessoa.";

export async function buscarResultadosPublicados() {
  // A política de leitura pública (RLS) já entrega só published=true e consent_confirmed=true;
  // os filtros abaixo deixam a regra explícita no código.
  const [resultados, extras] = await Promise.all([
    buscar("results?select=*,treatments(name,slug)&published=eq.true&consent_confirmed=eq.true&order=published_at.desc.nullslast,created_at.desc"),
    buscar("result_images?select=*&order=position.asc,created_at.asc"),
  ]);
  const porResultado = new Map();
  for (const im of extras) {
    if (!porResultado.has(im.result_id)) porResultado.set(im.result_id, []);
    porResultado.get(im.result_id).push(im);
  }
  return resultados.filter((r) => r.public_id && r.slug).map((r) => ({ ...r, extras: porResultado.get(r.id) || [] }));
}

export const urlDoResultado = (r) => `${SITE}/resultados/${r.slug}.html`;

// Lista ordenada de TODAS as fotos do resultado (antes, depois, extras).
export function fotosDoResultado(r) {
  const fotos = [];
  const antes = urlSegura(r.before_image_url), depois = urlSegura(r.after_image_url);
  if (antes) fotos.push({ chave: "antes", url: antes, alt: `Antes do tratamento — ${r.title}`, legenda: "Antes" });
  if (depois) fotos.push({ chave: "depois", url: depois, alt: `Depois do tratamento — ${r.title}`, legenda: "Depois" });
  (r.extras || []).forEach((e, i) => {
    const url = urlSegura(e.url);
    if (!url) return;
    fotos.push({ chave: `extra-${i + 1}`, url, alt: (e.alt || "").trim() || `${r.title} — foto ${i + 1}`, legenda: (e.caption || "").trim() || (e.alt || "").trim() || `Foto ${i + 1}` });
  });
  return fotos;
}

function posicaoImagem(r, lado) {
  const eixo = lado === "antes" ? "before_image_position_" : "after_image_position_";
  const x = Math.max(0, Math.min(100, Number(r[eixo + "x"] ?? 50)));
  const y = Math.max(0, Math.min(100, Number(r[eixo + "y"] ?? 50)));
  return `${x}% ${y}%`;
}

function cardResultado(r) {
  const antes = urlSegura(r.before_image_url), depois = urlSegura(r.after_image_url);
  const posAntes = posicaoImagem(r, "antes"), posDepois = posicaoImagem(r, "depois");
  const slider = antes && depois
    ? `<div class="antes-depois-slider" data-antes-depois><img class="ad-depois" src="${escapeHtml(depois)}" alt="Depois — ${escapeHtml(r.title)}" style="object-position:${posDepois}"><img class="ad-antes" src="${escapeHtml(antes)}" alt="Antes — ${escapeHtml(r.title)}" style="object-position:${posAntes}"><span class="ad-tag ad-tag-antes">Antes</span><span class="ad-tag ad-tag-depois">Depois</span><div class="ad-handle"><span class="ad-handle-grip"></span></div></div>` : "";
  return `<article class="card">${slider}<div class="card__corpo">${r.treatments ? `<span class="selo">${escapeHtml(r.treatments.name)}</span>` : ""}<h3>${escapeHtml(r.title)}</h3><p>${escapeHtml(r.description)}</p><a class="card__link" href="/resultados/${escapeHtml(r.slug)}.html">Ver caso completo →</a></div></article>`;
}

const SEO_RESULTADOS = {
  "resultado-de-limpeza-de-pele-nanotecnologica-caso-01": {
    title: "Limpeza nanotecnológica: caso 01 | Especialista em Pele",
    headline: "Limpeza de pele nanotecnológica — caso 01",
    description: "Registro fotográfico do caso 01 de limpeza de pele nanotecnológica. A indicação e a resposta variam conforme a avaliação individual.",
    intro: "Este registro documenta um caso específico de limpeza de pele nanotecnológica. A fotografia permite observar apenas as condições registradas neste atendimento; não prevê a resposta de outras pessoas."
  },
  "resultado-de-limpeza-de-pele-nanotecnologica-caso-02": {
    title: "Limpeza nanotecnológica: caso 02 | Especialista em Pele",
    headline: "Limpeza de pele nanotecnológica — caso 02",
    description: "Veja o registro fotográfico do caso 02 de limpeza de pele nanotecnológica e conheça a importância da indicação individualizada.",
    intro: "Este caso faz parte dos registros de limpeza de pele nanotecnológica. A técnica e os cuidados devem ser definidos conforme as características e a sensibilidade de cada pele."
  },
  "resultado-de-limpeza-de-pele-nanotecnologica-caso-03": {
    title: "Limpeza nanotecnológica: caso 03 | Especialista em Pele",
    headline: "Limpeza de pele nanotecnológica — caso 03",
    description: "Registro do caso 03 de limpeza de pele nanotecnológica. A avaliação profissional orienta a escolha da técnica e dos cuidados.",
    intro: "O registro apresenta um caso individual de limpeza de pele nanotecnológica. Imagens de antes e depois devem ser interpretadas considerando as condições da pele e o contexto do atendimento."
  },
  "resultado-de-limpeza-de-pele-nanotecnologica-caso-04": {
    title: "Limpeza nanotecnológica: caso 04 | Especialista em Pele",
    headline: "Limpeza de pele nanotecnológica — caso 04",
    description: "Conheça o registro fotográfico do caso 04 de limpeza de pele nanotecnológica. A resposta ao cuidado não é igual para todas as pessoas.",
    intro: "Este registro fotográfico corresponde a um atendimento específico. A limpeza de pele é indicada após considerar as características cutâneas, a sensibilidade e os objetivos de cuidado."
  },
  "resultado-de-limpeza-de-pele-nanotecnologica-caso-05": {
    title: "Limpeza nanotecnológica: caso 05 | Especialista em Pele",
    headline: "Limpeza de pele nanotecnológica — caso 05",
    description: "Caso 05 de limpeza de pele nanotecnológica: veja o registro publicado e entenda por que os cuidados devem ser individualizados.",
    intro: "As imagens deste caso documentam uma situação individual e não constituem promessa de resultado. A técnica e os produtos precisam ser escolhidos de acordo com a avaliação da pele."
  },
  "resultado-de-limpeza-de-pele-nanotecnologica-caso-06": {
    title: "Limpeza nanotecnológica: caso 06 | Especialista em Pele",
    headline: "Limpeza de pele nanotecnológica — caso 06",
    description: "Registro fotográfico do caso 06 de limpeza de pele nanotecnológica, com indicação definida conforme as necessidades individuais.",
    intro: "Este caso integra os registros de limpeza de pele profissional. A aparência após o atendimento pode variar segundo a condição cutânea, a técnica utilizada e os cuidados posteriores."
  },
  "resultado-de-limpeza-de-pele-nanotecnologica-caso-07": {
    title: "Limpeza nanotecnológica: caso 07 | Especialista em Pele",
    headline: "Limpeza de pele nanotecnológica — caso 07",
    description: "Veja o caso 07 de limpeza de pele nanotecnológica. O registro é informativo e não garante uma resposta semelhante em outras peles.",
    intro: "Este registro apresenta um caso individual de limpeza de pele nanotecnológica. A escolha do procedimento depende de avaliação e não deve ser generalizada a partir de uma única fotografia."
  },
  "resultado-de-limpeza-de-pele-nanotecnologica-caso-08": {
    title: "Limpeza nanotecnológica: caso 08 | Especialista em Pele",
    headline: "Limpeza de pele nanotecnológica — caso 08",
    description: "Registro do caso 08 de limpeza de pele nanotecnológica. Conheça a abordagem de cuidado com avaliação individual da pele.",
    intro: "A página documenta um atendimento específico de limpeza de pele nanotecnológica. A resposta e a necessidade de cuidados complementares variam conforme cada pessoa."
  },
  "resultado-de-limpeza-de-pele-nanotecnologica-caso-09": {
    title: "Limpeza nanotecnológica: caso 09 | Especialista em Pele",
    headline: "Limpeza de pele nanotecnológica — caso 09",
    description: "Caso 09 de limpeza de pele nanotecnológica: registro visual de um atendimento, sem promessa de resultado ou prazo universal.",
    intro: "Este registro visual corresponde a um caso individual. A indicação da limpeza de pele e as orientações posteriores devem considerar a condição cutânea e a avaliação profissional."
  },
  "mancha-solar": {
    title: "Mancha solar: registro de tratamento | Especialista em Pele",
    headline: "Registro de cuidado para mancha solar",
    description: "Veja o registro de uma mancha solar após mais de quatro meses de acompanhamento. A evolução é individual e exige cuidados contínuos.",
    intro: "Este caso registra a evolução descrita ao longo de mais de quatro meses. A aparência de manchas pode variar com fototipo, exposição solar, rotina de fotoproteção e cuidados indicados; uma imagem isolada não permite prever a resposta de outras pessoas."
  },
  "poros-dilatados": {
    title: "Poros dilatados: cuidado da pele | Especialista em Pele",
    headline: "Registro de cuidados para poros dilatados",
    description: "Registro fotográfico de cuidados voltados à aparência dos poros. A textura da pele varia e depende de características individuais.",
    intro: "Os poros fazem parte da estrutura normal da pele e sua aparência depende de fatores como oleosidade, genética e textura cutânea. Este registro documenta um caso individual, sem prometer que os poros possam ser eliminados."
  },
  "rejuvenescimento-de-colo": {
    title: "Rejuvenescimento do colo: registro | Especialista em Pele",
    headline: "Registro de cuidados para rejuvenescimento do colo",
    description: "Conheça um registro de cuidados para a pele do colo ao longo de três meses. A resposta depende da condição cutânea e da rotina de cuidados.",
    intro: "Este caso apresenta um registro após três meses de acompanhamento, conforme a informação publicada. A pele do colo tem características próprias e a evolução depende dos cuidados, da exposição solar e das condições individuais."
  },
  "remocao-de-nigras01": {
    title: "Remoção de comedões: registro do caso | Especialista em Pele",
    headline: "Registro de remoção de comedões",
    description: "Registro de remoção de comedões no pós-imediato. A técnica deve ser indicada conforme a condição da pele e realizada com cuidado.",
    intro: "Este registro mostra o pós-imediato de um procedimento de remoção de comedões. A indicação e a técnica dependem da avaliação da pele; vermelhidão ou sensibilidade temporária podem variar de pessoa para pessoa."
  },
  "resultado-com-mais-de-2-meses-de-tratamento": {
    title: "Rejuvenescimento facial: acompanhamento | Especialista em Pele",
    headline: "Acompanhamento de rejuvenescimento facial após dois meses",
    description: "Registro de acompanhamento facial após mais de dois meses, com cuidados para a pele e orientações domiciliares. A evolução é individual.",
    intro: "Este caso descreve acompanhamento por mais de dois meses e inclui orientações de cuidados domiciliares. O registro é específico desta pessoa; não comprova que exercícios, massagens ou procedimentos produzam o mesmo efeito em todos os casos."
  },
  "resultado-imediato-com-a-limpeza-de-pele-nanotecnologica": {
    title: "Limpeza nanotecnológica: resultado | Especialista em Pele",
    headline: "Resultado da limpeza de pele nanotecnológica",
    description: "Antes e depois de uma limpeza de pele nanotecnológica. Entenda a técnica e por que a indicação depende de avaliação individual.",
    intro: "Este caso apresenta um registro fotográfico após uma limpeza de pele nanotecnológica. A aparência imediata pode variar conforme as condições da pele, a técnica e os cuidados realizados; uma fotografia isolada não permite prever a resposta de outras pessoas."
  },

  "resultado-da-tecnica-de-bioredutora": {
    title: "BioRedutora: resultado corporal | Especialista em Pele",
    headline: "Resultado de tratamento corporal com BioRedutora",
    description: "Veja um caso acompanhado com protocolo BioRedutora em cinco sessões. Conheça a abordagem individualizada; os resultados variam de pessoa para pessoa.",
    intro: "Este caso documenta a evolução observada após um plano de cinco sessões de BioRedutora, com acompanhamento individualizado. O registro é informativo: a indicação, o número de sessões e a resposta ao tratamento dependem de avaliação profissional e das características de cada pessoa."
  },
  "com-25-dias-de-tratamento-para-definicao-corporal": {
    title: "Definição corporal em 25 dias | Especialista em Pele",
    headline: "Registro de definição corporal após 25 dias",
    description: "Conheça o registro de definição corporal após 25 dias com técnica Biohipertrofia e acompanhamento individualizado. Resultados variam.",
    intro: "Este caso registra a evolução observada ao longo de 25 dias em um protocolo de Biohipertrofia, com atendimentos semanais conforme o plano descrito. O período e a resposta são específicos deste caso e não representam prazo ou resultado garantido."
  },
  "dez-sessoes-de-reducao-corporal": {
    title: "Redução corporal após 10 sessões | Especialista em Pele",
    headline: "Resultado de redução corporal após 10 sessões",
    description: "Veja um caso de redução corporal acompanhado ao longo de 10 sessões, com planejamento individualizado e intervalos definidos para a paciente.",
    intro: "Este registro apresenta um protocolo de redução corporal realizado ao longo de dez sessões, com intervalo de cinco dias entre elas conforme a descrição do caso. A evolução é individual e não representa uma previsão de resultado para outras pessoas."
  },
  "duas-sessoes-de-reducao-corporal": {
    title: "Redução corporal após 2 sessões | Especialista em Pele",
    headline: "Registro de redução corporal após duas sessões",
    description: "Registro de evolução em protocolo de redução corporal após duas sessões ao longo de duas semanas. Cada resposta depende da avaliação individual.",
    intro: "Este caso documenta uma etapa inicial de acompanhamento corporal após duas sessões realizadas ao longo de duas semanas, conforme o registro publicado. Uma observação inicial não permite prever o resultado final; indicação, intervalos e resposta são individuais."
  },
  "gordura-localizada-em-abdomen": {
    title: "Gordura localizada no abdômen | Especialista em Pele",
    headline: "Acompanhamento corporal para gordura localizada no abdômen",
    description: "Conheça um registro de acompanhamento para gordura localizada no abdômen após cinco sessões. Medidas e evolução variam conforme a resposta individual.",
    intro: "Este registro apresenta um acompanhamento corporal direcionado à região abdominal. O caso descreve cinco sessões e a evolução de medidas específicas; esses dados não substituem uma avaliação individual e não garantem resultados semelhantes para outras pessoas."
  }
};

export function paginaHtml(r, { fotos, dims, outros = [] }) {
  const trat = r.treatments || null;
  const urlCanonica = urlDoResultado(r);
  const seoCaso = SEO_RESULTADOS[r.slug] || null;
  const tituloPagina = seoCaso?.headline || r.title;
  const introSeo = seoCaso?.intro || "";
  // SEO editorial específico para páginas de limpeza de pele; os HTML publicados
  // continuam sendo gerados por este script, sem edição manual de arquivos gerados.
  const ehLimpeza = /limpeza[\s-]+de[\s-]+pele|limpeza[\s-]+nanotecnol[oó]gica/i
    .test(`${r.title || ""} ${trat?.name || ""} ${trat?.slug || ""}`);
  // evita "Resultado … — Resultado real" quando o título já começa com "Resultado"
  const tituloBase = ehLimpeza
    ? `Limpeza de Pele Profissional | ${r.title}`
    : (/^resultado/i.test(r.title) ? r.title : `${r.title} — Resultado real`);
  const tituloCompleto = tituloSeo(seoCaso?.title || tituloBase);
  const corpoTexto = (r.content || "").trim();
  const descricaoBase = [r.title, (r.description || "").trim() || textoPuro(corpoTexto)]
    .filter(Boolean).join(". ").replace(/\.\.+/g, ".");
  const descricaoMeta = resumir(seoCaso?.description || (ehLimpeza
    ? `Estética facial e limpeza de pele profunda: ${descricaoBase}. Caso real publicado com consentimento; resultados variam de pessoa para pessoa.`
    : `${descricaoBase}. Resultado real, com consentimento da paciente.`
  ));
  const publicado = dataISO(r.published_at || r.created_at);
  const modificado = dataISO(r.updated_at) || publicado;
  const principal = fotos.find((f) => f.chave === "depois") || fotos[0];
  const imagemMeta = principal?.url || `${SITE}/assets/og-image.jpg`;
  const dimMeta = principal ? dims.get(principal.url) : null;
  const antes = fotos.find((f) => f.chave === "antes"), depois = fotos.find((f) => f.chave === "depois");

  const objetosImagem = fotos.map((f) => {
    const d = dims.get(f.url);
    return {
      "@type": "ImageObject", contentUrl: f.url, url: f.url, name: f.legenda === "Antes" || f.legenda === "Depois" ? `${f.legenda} — ${r.title}` : f.legenda,
      caption: f.alt, description: f.alt, ...(d ? { width: d.w, height: d.h } : {}),
      uploadDate: publicado, creditText: "Especialista em Pele", creator: EDITORA,
      representativeOfPage: f === principal || undefined,
    };
  });

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["WebPage", "ImageGallery"],
        "@id": `${urlCanonica}#resultado`,
        identifier: r.public_id,
        name: tituloPagina,
        headline: tituloPagina,
        description: descricaoMeta,
        url: urlCanonica,
        inLanguage: "pt-BR",
        datePublished: publicado,
        dateModified: modificado,
        about: trat ? { "@type": "Thing", name: trat.name } : undefined,
        author: EDITORA,
        publisher: EDITORA,
        isPartOf: { "@type": "CollectionPage", name: "Resultados — Especialista em Pele", url: `${SITE}/resultados/` },
        primaryImageOfPage: objetosImagem.find((o) => o.representativeOfPage),
        image: objetosImagem.map((o) => o.contentUrl),
        associatedMedia: objetosImagem,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Início", item: `${SITE}/` },
          { "@type": "ListItem", position: 2, name: "Resultados", item: `${SITE}/resultados/` },
          { "@type": "ListItem", position: 3, name: r.title, item: urlCanonica },
        ],
      },
    ],
  };

  const slider = antes && depois
    ? `<div class="antes-depois-slider" data-antes-depois role="img" aria-label="Comparação antes e depois: ${escapeHtml(r.title)}. Arraste para os lados." style="max-width:520px;margin:24px auto">
        <img class="ad-depois" src="${escapeHtml(depois.url)}" alt=""${attrDim(dims.get(depois.url))} decoding="async" fetchpriority="high" style="object-position:${posicaoImagem(r, "depois")}">
        <img class="ad-antes" src="${escapeHtml(antes.url)}" alt=""${attrDim(dims.get(antes.url))} decoding="async" style="object-position:${posicaoImagem(r, "antes")}">
        <span class="ad-tag ad-tag-antes">Antes</span><span class="ad-tag ad-tag-depois">Depois</span>
        <div class="ad-handle"><span class="ad-handle-grip"></span></div>
      </div>
      <p class="texto-suave texto-centro" style="font-size:13px;margin-top:-8px">Arraste a foto para os lados para comparar o antes e o depois.</p>` : "";

  const galeria = fotos.map((f, i) => `<figure style="margin:0"><img src="${escapeHtml(f.url)}" alt="${escapeHtml(f.alt)}"${attrDim(dims.get(f.url))} loading="${i < 2 ? "eager" : "lazy"}" decoding="async" style="width:100%;height:auto;border-radius:10px"><figcaption class="card__meta" style="margin-top:8px">${escapeHtml(f.legenda)}</figcaption></figure>`).join("\n      ");

  const corpo = r.slug === "resultado-imediato-com-a-limpeza-de-pele-nanotecnologica"
    ? `<h3>Limpeza de pele convencional x nanotecnológica</h3>
      <p>A limpeza de pele é um cuidado que ajuda a remover impurezas e, quando indicado, desobstruir os poros. A técnica escolhida deve considerar as características e a sensibilidade de cada pele.</p>
      <p><strong>Limpeza de pele convencional:</strong> prioriza a higienização, a remoção de impurezas e a extração de comedões quando apropriada. A experiência e a resposta dependem da técnica e das condições individuais.</p>
      <p><strong>Limpeza de pele nanotecnológica:</strong> combina a higienização com produtos cosméticos que utilizam sistemas de dimensões nanométricas. Conforme a formulação, esses sistemas podem influenciar a estabilidade, a liberação e a interação dos ativos com a pele. Os efeitos dependem do produto utilizado e não devem ser generalizados para todas as formulações.</p>
      <p>A quantidade de comedões removidos e a aparência da pele logo após a sessão variam de acordo com a condição cutânea, a presença de comedões e a técnica empregada. Não é possível garantir um percentual de remoção nem um resultado idêntico para todas as pessoas.</p>
      <p>Os cuidados posteriores devem respeitar a integridade da barreira cutânea e as orientações profissionais. A indicação em peles maduras, sensíveis ou com alterações cutâneas exige avaliação individual e escolha cuidadosa dos produtos.</p>`
    : corpoTexto ? renderizarConteudo(corpoTexto) : "";
  const linkTrat = trat?.slug ? `${SITE}/tratamentos/${slugifyUrl(trat.slug)}.html` : "";
  const outrosHtml = outros.length
    ? `<h2 style="font-size:1.25rem;margin-top:44px">Outros resultados${trat ? ` de ${escapeHtml(trat.name)}` : ""}</h2><ul style="margin:12px 0 0 20px;line-height:1.9">${outros.map((o) => `<li><a href="/resultados/${escapeHtml(o.slug)}.html">${escapeHtml(o.title)}</a></li>`).join("")}</ul>` : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(tituloCompleto)}</title>
${marcadorId(r.public_id)}
<meta name="description" content="${escapeHtml(descricaoMeta)}">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<meta property="og:type" content="article">
<meta property="og:title" content="${escapeHtml(tituloCompleto)}">
<meta property="og:description" content="${escapeHtml(descricaoMeta)}">
<meta property="og:site_name" content="Especialista em Pele">
<meta property="og:url" content="${urlCanonica}">
<meta property="og:image" content="${escapeHtml(imagemMeta)}">
${principal ? `<meta property="og:image:alt" content="${escapeHtml(principal.alt)}">` : ""}
${dimMeta ? `<meta property="og:image:width" content="${dimMeta.w}">\n<meta property="og:image:height" content="${dimMeta.h}">` : ""}
<meta property="og:locale" content="pt_BR">
${publicado ? `<meta property="article:published_time" content="${publicado}">` : ""}
${modificado ? `<meta property="article:modified_time" content="${modificado}">` : ""}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(tituloCompleto)}">
<meta name="twitter:description" content="${escapeHtml(descricaoMeta)}">
<meta name="twitter:image" content="${escapeHtml(imagemMeta)}">
<link rel="canonical" href="${urlCanonica}">
<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>
<link rel="stylesheet" href="/assets/css/paginas.css">
<link rel="stylesheet" href="/assets/css/antes-depois-slider.css">
<link rel="stylesheet" href="/assets/css/mobile-nav.css">
<style>.resultado-corpo p{font-size:17px;line-height:1.7;margin-bottom:18px}.galeria-caso{display:grid;gap:18px;grid-template-columns:1fr}@media(min-width:640px){.galeria-caso{grid-template-columns:repeat(2,1fr)}}</style>
<link rel="icon" href="/assets/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="512x512" href="/assets/favicon-512.png">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
</head>
<body data-pagina="resultados">
${cabecalho("resultados")}
<main>
  <nav class="wrap breadcrumb" aria-label="Você está em"><a href="/">Início</a> &gt; <a href="/resultados/">Resultados</a> &gt; <span>${escapeHtml(r.title)}</span></nav>
  <article class="secao wrap" style="max-width:76ch">
    <p class="card__meta texto-centro">${trat ? `<span class="selo">${escapeHtml(trat.name)}</span> ` : ""}${publicado ? `<time datetime="${publicado}">${escapeHtml(dataBR(r.published_at || r.created_at))}</time>` : ""}</p>
    <h1 class="texto-centro">${escapeHtml(tituloPagina)}</h1>
    ${introSeo ? `<p class="texto-centro" style="font-size:16px;line-height:1.7;max-width:850px;margin:16px auto 24px">${escapeHtml(introSeo)}</p>` : ""}
    ${slider}
    ${r.description ? `<p class="texto-centro" style="font-size:18px;line-height:1.6">${escapeHtml(r.description)}</p>` : ""}
    ${ehLimpeza && !seoCaso && r.slug !== "resultado-imediato-com-a-limpeza-de-pele-nanotecnologica" ? `<p class="texto-centro" style="font-size:16px;line-height:1.7">Este registro integra os casos de limpeza de pele profissional da Especialista em Pele. A limpeza de pele profunda faz parte dos cuidados de estética facial quando indicada após avaliação individual. Fotografias documentam um caso específico e não garantem resultados iguais para outras pessoas.</p>` : ""}
    <h2 style="margin-top:36px">Sobre este resultado</h2>
    <div class="resultado-corpo">${corpo || `<p>Registro fotográfico de um caso${trat ? ` de ${escapeHtml(trat.name)}` : ""} atendido na Especialista em Pele${r.description ? `: ${escapeHtml(r.description.replace(/[.\s]+$/, ""))}` : ""}.</p>`}<p class="texto-suave" style="font-size:14px">${AVISO}</p></div>
    <h2 style="margin-top:36px">Fotos do caso</h2>
    <div class="galeria-caso">
      ${galeria}
    </div>
    <h2 style="margin-top:44px">${trat ? "Tratamento realizado" : "Quer um resultado assim?"}</h2>
    <p>${linkTrat ? `Saiba como funciona o tratamento: <a href="/tratamentos/${escapeHtml(slugifyUrl(trat.slug))}.html">${escapeHtml(trat.name)}</a>. ` : ""}Conheça também outros <a href="/resultados/">resultados reais</a> e os <a href="/blog/">conteúdos sobre saúde da pele</a>.</p>
    ${outrosHtml}
  </article>
  <section class="secao fundo-escura texto-centro">
    <div class="wrap">
      <h2>Quer entender o que é possível para a sua pele?</h2>
      <a class="btn btn-claro" data-whatsapp-link href="#" style="margin-top:16px">Falar no WhatsApp</a>
    </div>
  </section>
</main>
${rodape()}
<script type="module">import { initAntesDepoisSlider } from "/assets/js/antes-depois-slider.js"; initAntesDepoisSlider(document);</script>
</body>
</html>
`;
}

export async function gerar({ log = console.log } = {}) {
  const resultados = await buscarResultadosPublicados();

  // dimensões de todas as fotos (uma vez por URL)
  const dims = new Map();
  for (const r of resultados) for (const f of fotosDoResultado(r)) if (!dims.has(f.url)) dims.set(f.url, await dimensoesImagem(f.url));

  const itens = resultados.map((r) => {
    const mesmos = resultados.filter((o) => o.id !== r.id && r.treatment_id && o.treatment_id === r.treatment_id);
    const outros = mesmos.slice(0, 4);
    return { id: r.public_id, slug: r.slug, html: paginaHtml(r, { fotos: fotosDoResultado(r), dims, outros }) };
  });

  const rel = sincronizarPastas({ pastas: [PASTA], urlBase: `${SITE}/resultados`, itens, log });

  const lista = resultados.length
    ? resultados.map(cardResultado).join("")
    : `<p class="texto-suave">Em breve, resultados documentados com consentimento das pacientes.</p>`;
  if (injetarLista(`${PASTA}/index.html`, lista)) log(`Listagem estática de /resultados/ atualizada (${resultados.length} resultado(s)).`);

  log(`\n${itens.length} página(s) de resultado em /${PASTA}/.`);
  return rel;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (!SUPABASE_ANON_KEY) { console.error("Faltou a variável de ambiente SUPABASE_ANON_KEY."); process.exit(1); }
  gerar().then((rel) => { if (rel.erros.length) { console.error("\nERROS:\n" + rel.erros.join("\n")); process.exit(1); } })
    .catch((e) => { console.error(e); process.exit(1); });
}
