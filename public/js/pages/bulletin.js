import { api, qs } from '../api.js';
import { anneesList, esc, fmt, options, safe } from '../ui.js';

export default async function bulletin(root) {
  const etu = await api.get('/api/etudiants');

  root.innerHTML = `
    <h1>Édition d'un bulletin des notes</h1>

    <section class="card no-print">
      <form id="form" class="grid">
        <label>N° de l'étudiant
          <input name="num" list="liste-num" required placeholder="E001" autocomplete="off">
          <datalist id="liste-num">
            ${etu.items.map((e) => `<option value="${esc(e.num_inscription)}">${esc(e.nom)}</option>`).join('')}
          </datalist>
        </label>
        <label>Année <select name="annee">${options(anneesList(), '', 'Année d\'inscription')}</select></label>
        <div class="actions"><button class="btn" type="submit">Afficher le bulletin</button></div>
      </form>
    </section>

    <section id="result"></section>`;

  const $ = (sel) => root.querySelector(sel);

  $('#form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const num = ev.target.num.value.trim();
    const annee = ev.target.annee.value;
    $('#result').innerHTML = '';
    const b = await safe(() => api.get(`/api/bulletin/${encodeURIComponent(num)}` + qs({ annee })));
    if (!b) return;

    const pdfUrl = `/api/bulletin/${encodeURIComponent(num)}/pdf` + qs({ annee: b.annee });
    $('#result').innerHTML = `
      <article class="card bulletin">
        <h2>BULLETIN DES NOTES</h2>
        <dl>
          <dt>N°ETUDIANT</dt><dd>${esc(b.etudiant.num_inscription)}</dd>
          <dt>NOM</dt><dd>${esc(b.etudiant.nom)}</dd>
          <dt>NIVEAU</dt><dd>${esc(b.etudiant.niveau)}</dd>
          <dt>ANNEE</dt><dd>${esc(b.annee)}</dd>
        </dl>
        <div class="table-wrap">
          <table>
            <thead><tr><th>DESIGNATION</th><th class="num">COEF</th><th class="num">NOTE</th><th class="num">NOTE PONDEREE</th></tr></thead>
            <tbody>
              ${
                b.lignes.length
                  ? b.lignes
                      .map((l) => `<tr><td>${esc(l.designation)}</td><td class="num">${fmt(l.coef)}</td><td class="num">${fmt(l.note)}</td><td class="num">${fmt(l.notePonderee)}</td></tr>`)
                      .join('')
                  : '<tr><td colspan="4" class="empty">Aucune note enregistrée pour cette année.</td></tr>'
              }
            </tbody>
            ${
              b.lignes.length
                ? `<tfoot>
                    <tr class="total"><td colspan="3">TOTAL (Σ note pondérée / Σ coef = ${fmt(b.sommePonderee)} / ${fmt(b.sommeCoef)})</td><td class="num">${fmt(b.sommePonderee)}</td></tr>
                    <tr class="total"><td colspan="3">MOYENNE</td><td class="num">${fmt(b.moyenne)}</td></tr>
                    <tr class="total"><td colspan="3">OBSERVATION</td><td class="num"><span class="pill ${esc(b.observation)}">${esc(b.observation)}</span></td></tr>
                  </tfoot>`
                : ''
            }
          </table>
        </div>
        <p class="legend">Admis : moyenne ≥ 10 · Redoublant : 7,5 ≤ moyenne &lt; 10 · Exclus : moyenne &lt; 7,5</p>
        <div class="actions no-print" style="margin-top:1rem">
          <a class="btn" href="${pdfUrl}" target="_blank" rel="noopener">Générer le PDF</a>
          <button class="btn secondary" type="button" id="print">Imprimer</button>
        </div>
      </article>`;
    $('#print').addEventListener('click', () => window.print());
  });
}
