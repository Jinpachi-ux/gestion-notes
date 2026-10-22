import { api, qs } from '../api.js';
import { NIVEAUX, anneesList, defaultAnnee, esc, options, safe } from '../ui.js';

const COLORS = { admis: '#2e7d32', redoublant: '#f9a825', exclus: '#c62828' };

function histogram(s) {
  const bars = [
    ['Admis', s.pctAdmis, s.admis, COLORS.admis],
    ['Redoublants', s.pctRedoublant, s.redoublant, COLORS.redoublant],
    ['Exclus', s.pctExclus, s.exclus, COLORS.exclus],
  ];
  const base = 230, maxH = 190;
  const body = bars
    .map(([label, pct, n, color], i) => {
      const h = (pct / 100) * maxH;
      const x = 60 + i * 130;
      return `<rect x="${x}" y="${base - h}" width="90" height="${h}" fill="${color}" rx="3"/>
        <text class="bar-label" x="${x + 45}" y="${base - h - 8}" text-anchor="middle">${pct} % (${n})</text>
        <text class="bar-label" x="${x + 45}" y="${base + 20}" text-anchor="middle">${label}</text>`;
    })
    .join('');
  return `<svg viewBox="0 0 480 260" role="img" aria-label="Histogramme des résultats">
    <line x1="40" y1="${base}" x2="460" y2="${base}" stroke="#444"/><line x1="40" y1="20" x2="40" y2="${base}" stroke="#444"/>
    ${body}</svg>`;
}

function pie(s) {
  const parts = [
    ['Admis', s.admis, COLORS.admis],
    ['Redoublants', s.redoublant, COLORS.redoublant],
    ['Exclus', s.exclus, COLORS.exclus],
  ].filter((p) => p[1] > 0);
  const cx = 150, cy = 130, r = 100;
  let angle = -Math.PI / 2;
  const slices = parts.map(([label, n, color]) => {
    if (parts.length === 1) return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}"/>`;
    const a = (n / s.total) * Math.PI * 2;
    const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
    angle += a;
    const x2 = cx + r * Math.cos(angle), y2 = cy + r * Math.sin(angle);
    return `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${a > Math.PI ? 1 : 0} 1 ${x2},${y2} Z" fill="${color}" stroke="#fff" stroke-width="2"><title>${label} : ${n}</title></path>`;
  });
  return `<svg viewBox="0 0 300 260" role="img" aria-label="Camembert des résultats">${slices.join('')}</svg>`;
}

export default async function stats(root) {
  root.innerHTML = `
    <h1>Statistiques des résultats</h1>

    <section class="card">
      <form id="form" class="grid">
        <label>Année <select name="annee" required>${options(anneesList(), defaultAnnee())}</select></label>
        <label>Niveau <select name="niveau">${options(NIVEAUX, '', 'Tous les niveaux')}</select></label>
        <div class="actions"><button class="btn" type="submit">Afficher</button></div>
      </form>
    </section>
    <section id="result"></section>`;

  root.querySelector('#form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const { annee, niveau } = ev.target;
    const result = root.querySelector('#result');
    result.innerHTML = '';
    const s = await safe(() => api.get('/api/stats' + qs({ annee: annee.value, niveau: niveau.value })));
    if (!s) return;
    if (!s.total) {
      result.innerHTML = '<p class="card empty">Aucune moyenne calculable pour cette sélection (pas de notes saisies).</p>';
      return;
    }
    const pdfUrl = '/api/stats/pdf' + qs({ annee: s.annee, niveau: s.niveau });
    result.innerHTML = `
      <article class="card">
        <h2>Année ${esc(s.annee)} · ${s.niveau ? 'Niveau ' + esc(s.niveau) : 'Tous niveaux'} · ${s.total} étudiant(s)</h2>
        <div class="stats-grid">
          <div>
            <table>
              <thead><tr><th>Catégorie</th><th class="num">Effectif</th><th class="num">%</th></tr></thead>
              <tbody>
                <tr><td><span class="swatch" style="background:${COLORS.admis}"></span>Admis (moy. ≥ 10)</td><td class="num">${s.admis}</td><td class="num">${s.pctAdmis}</td></tr>
                <tr><td><span class="swatch" style="background:${COLORS.redoublant}"></span>Redoublants (7,5 ≤ moy. &lt; 10)</td><td class="num">${s.redoublant}</td><td class="num">${s.pctRedoublant}</td></tr>
                <tr><td><span class="swatch" style="background:${COLORS.exclus}"></span>Exclus (moy. &lt; 7,5)</td><td class="num">${s.exclus}</td><td class="num">${s.pctExclus}</td></tr>
              </tbody>
            </table>
            <div class="actions" style="margin-top:1rem">
              <button class="btn secondary" type="button" id="mode">Afficher le camembert</button>
              <a class="btn" href="${pdfUrl}" target="_blank" rel="noopener">Générer le PDF</a>
            </div>
          </div>
          <div class="chart" id="chart">${histogram(s)}</div>
        </div>
      </article>`;

    let mode = 'histogramme';
    const chart = root.querySelector('#chart');
    root.querySelector('#mode').addEventListener('click', (e) => {
      mode = mode === 'histogramme' ? 'camembert' : 'histogramme';
      chart.innerHTML = mode === 'histogramme' ? histogram(s) : pie(s);
      e.target.textContent = mode === 'histogramme' ? 'Afficher le camembert' : 'Afficher l\'histogramme';
    });
  });
}
