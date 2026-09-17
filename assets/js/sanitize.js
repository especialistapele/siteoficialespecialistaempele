export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

export function safeUrl(value, { allowRelative = false } = {}) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  if (allowRelative && raw.startsWith('/')) return raw;
  try {
    const url = new URL(raw, window.location.origin);
    if (url.protocol === 'https:' || url.protocol === 'http:') return url.href;
  } catch (_) {}
  return '';
}
