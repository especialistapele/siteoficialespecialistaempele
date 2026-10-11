export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

export function safeUrl(value, { allowRelative = false } = {}) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  if (allowRelative && raw.startsWith('/') && !raw.startsWith('//') && !raw.includes('\\')) return raw;
  try {
    const url = new URL(raw, window.location.origin);
    if (url.origin === window.location.origin || url.protocol === 'https:') return url.href;
  } catch (_) {}
  return '';
}
