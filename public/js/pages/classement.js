import { api, qs } from '../api.js';
import { NIVEAUX, anneesList, defaultAnnee, esc, fmt, options, safe } from '../ui.js';

export default async function classement(root) {
  root.innerHTML = `
    <h1>Classement par ordre de mérite</h1>

    <section class="card">
      <form id="form" class="grid">
        <label>Année <select name="annee" required>${options(anneesList(), defaultAnnee())}</select></label>
        <label>Niveau <select name="niveau" required>${options(NIVEAUX)}</select></label>
        <div class="actions"><button class="btn" type="submit">Afficher le classement</button></div>
      </form>
    </section>

    <section id="result"></section>`;

  root.querySelector('#form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const { annee, niveau } = ev.target;
    const result = root.querySelector('#result');
    result.innerHTML = '';
    const data = await safe(() => api.get('/api/classement' + qs({ annee: annee.value, niveau: niveau.value })));
    if (!data) return;
    result.innerHTML = `
      <article class="card">
        <h2>ANNEE : ${esc(data.annee)} &nbsp;·&nbsp; NIVEAU : ${esc(data.niveau)}</h2>
        <p><strong>Effectif classé : ${data.effectif}</strong></p>
        <div class="table-wrap">
          <table>
            <thead><tr><th class="num">Rang</th><th>N° ETUDIANT</th><th>NOM</th><th class="num">MOYENNE</th><th>Observation</th></tr></thead>
            <tbody>
              ${
                data.items.length
                  ? data.items
                      .map(
                        (r) => `<tr><td class="num">${r.rang}</td><td>${esc(r.num_inscription)}</td><td>${esc(r.nom)}</td>
                          <td class="num">${fmt(r.moyenne)}</td><td><span class="pill ${esc(r.observation)}">${esc(r.observation)}</span></td></tr>`
                      )
                      .join('')
                  : '<tr><td colspan="5" class="empty">Aucun étudiant avec des notes pour ce niveau et cette année.</td></tr>'
              }
            </tbody>
          </table>
        </div>
        <p class="legend">Classement par ordre décroissant des moyennes ; les ex æquo partagent le même rang.</p>
      </article>`;
  });
}
