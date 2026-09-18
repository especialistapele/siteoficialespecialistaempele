// ============================================================
// contrato-pdf.js — monta um PDF simples do contrato assinado
// (texto + assinatura desenhada) para o paciente baixar.
// jsPDF é carregado sob demanda (só quando o paciente clica em
// "Baixar"), então não pesa nas outras páginas do painel.
// ============================================================

function htmlParaTexto(html) {
  const div = document.createElement("div");
  div.innerHTML = String(html ?? "");
  div.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
  div.querySelectorAll("p, div").forEach((el) => el.append("\n"));
  return (div.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
}

async function urlParaDataUrl(url) {
  const resposta = await fetch(url);
  const blob = await resposta.blob();
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(leitor.result);
    leitor.onerror = reject;
    leitor.readAsDataURL(blob);
  });
}

// contrato: linha da tabela contracts (já assinado)
// opções: { patientName, signatureUrl } — signatureUrl é a signed URL do Storage
export async function baixarPdfContrato(contrato, { patientName, signatureUrl }) {
  const { jsPDF } = await import("https://cdn.jsdelivr.net/npm/jspdf@2.5.2/+esm");

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margem = 50;
  const larguraUtil = doc.internal.pageSize.getWidth() - margem * 2;
  const alturaPagina = doc.internal.pageSize.getHeight();
  let y = margem;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(contrato.title || "Contrato", margem, y);
  y += 28;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const texto = htmlParaTexto(contrato.signed_content_html || contrato.content_html);
  const linhas = doc.splitTextToSize(texto, larguraUtil);
  linhas.forEach((linha) => {
    if (y > alturaPagina - 170) { doc.addPage(); y = margem; }
    doc.text(linha, margem, y);
    y += 15;
  });

  if (y > alturaPagina - 170) { doc.addPage(); y = margem; }
  y += 24;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Assinatura do paciente:", margem, y);
  y += 10;

  if (signatureUrl) {
    try {
      const dataUrl = await urlParaDataUrl(signatureUrl);
      doc.addImage(dataUrl, "PNG", margem, y, 200, 80);
      y += 90;
    } catch (_) {
      y += 10;
    }
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const dataAssinatura = contrato.signed_at
    ? new Date(contrato.signed_at).toLocaleString("pt-BR")
    : "";
  doc.text(`Assinado por ${patientName || "paciente"} em ${dataAssinatura}.`, margem, y);
  y += 13;
  if (contrato.signed_user_agent) {
    doc.text(`Dispositivo: ${String(contrato.signed_user_agent).slice(0, 110)}`, margem, y);
  }

  const nomeArquivo = `contrato-${(contrato.title || "contrato").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60)}.pdf`;
  doc.save(nomeArquivo);
}
