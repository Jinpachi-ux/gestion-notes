// Petits utilitaires d'interface partagés par toutes les pages
export const NIVEAUX = ['L1', 'L2', 'L3', 'M1', 'M2'];

export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** Année universitaire en cours (rentrée en septembre), ex. "2026-2027". */
export function defaultAnnee() {
  const d = new Date();
  const y = d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}-${y + 1}`;
}

/** Liste déroulante d'années : de (année en cours - 6) à (année en cours + 1). */
export function anneesList() {
  const start = Number(defaultAnnee().slice(0, 4));
  const list = [];
  for (let y = start + 1; y >= start - 6; y--) list.push(`${y}-${y + 1}`);
  return list;
}

/** options : tableau de valeurs ou de { value, label } */
export function options(items, selected = '', placeholder = null) {
  const opts = items.map((it) => {
    const value = typeof it === 'object' ? it.value : it;
    const label = typeof it === 'object' ? it.label : it;
    return `<option value="${esc(value)}"${String(value) === String(selected) ? ' selected' : ''}>${esc(label)}</option>`;
  });
  if (placeholder !== null) opts.unshift(`<option value="">${esc(placeholder)}</option>`);
  return opts.join('');
}

export function toast(message, type = 'info') {
  const box = document.getElementById('toasts');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  box.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

/** Exécute une action asynchrone et affiche l'erreur éventuelle. */
export async function safe(fn) {
  try {
    return await fn();
  } catch (e) {
    toast(e.message, 'error');
    return undefined;
  }
}

export const fmt = (n) => (n === null || n === undefined ? '' : Number(n).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1'));
