export async function otimizarImagemParaWebP(arquivo, maxDimensao = 2000, qualidade = 0.82) {
  if (!arquivo || !arquivo.type.startsWith('image/')) throw new Error('Arquivo de imagem inválido.');
  const bitmap = await createImageBitmap(arquivo);
  const fatorReducao = 0.85; // reduz as dimensões em 15% quando a imagem é maior que o limite útil
  const limite = Math.min(maxDimensao, Math.max(bitmap.width, bitmap.height) * fatorReducao);
  const escala = Math.min(1, limite / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * escala));
  canvas.height = Math.max(1, Math.round(bitmap.height * escala));
  const ctx = canvas.getContext('2d', { alpha: true });
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('Não foi possível otimizar a imagem.')), 'image/webp', qualidade));
  return new File([blob], arquivo.name.replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp', lastModified: Date.now() });
}
