import { api, qs } from '../api.js';
import { anneesList, defaultAnnee, esc, fmt, options, safe, toast } from '../ui.js';

export default async function notes(root) {
  const [etu, mat] = await Promise.all([api.get('/api/etudiants'), api.get('/api/matieres')]);
  const etuOpts = etu.items.map((e) => ({ value: e.num_inscription, label: `${e.num_inscription} - ${e.nom}` }));
  const matOpts = mat.items.map((m) => ({ value: m.codemat, label: `${m.codemat} - ${m.libelle} (coef ${fmt(m.coef)})` }));
  let editing = null; // { codemat, num, annee }
  let items = [];

  root.innerHTML = `
    <h1>Gestion des notes</h1>

    <section class="card">
      <h2 id="form-title">Saisir une note</h2>
      ${
        etuOpts.length && matOpts.length
          ? ''
          : '<p class="empty">Enregistrez d\'abord au moins un étudiant et une matière.</p>'
      }
      <form id="form" class="grid">
        <label>N° d'inscription <select name="num" required>${options(etuOpts, '', 'Choisir…')}</select></label>
        <label>Année <select name="annee" required>${options(anneesList(), defaultAnnee())}</select></label>
        <label>Matière <select name="codemat" required>${options(matOpts, '', 'Choisir…')}</select></label>
        <label>Note (0 à 20) <input name="note" type="number" min="0" max="20" step="0.25" required></label>
        <div class="actions">
          <button class="btn" type="submit">Enregistrer</button>
          <button class="btn secondary" type="button" id="cancel" hidden>Annuler</button>
        </div>
      </form>
    </section>

    <section class="card">
      <h2>Liste des notes</h2>
      <div class="toolbar">
        <label>Étudiant <select id="f-num">${options(etuOpts, '', 'Tous')}</select></label>
        <label>Année <select id="f-annee">${options(anneesList(), '', 'Toutes')}</select></label>
      </div>
      <p><strong>Effectif : <span id="effectif">0</span></strong></p>
      <div class="table-wrap">
        <table>
          <thead><tr><th>N°</th><th>Nom</th><th>Année</th><th>Matière</th><th class="num">Coef</th><th class="num">Note</th><th></th></tr></thead>
          <tbody id="rows"></tbody>
        </table>
      </div>
    </section>`;

  const $ = (sel) => root.querySelector(sel);
  const form = $('#form');
  const keyOf = (n) => `${n.codemat}|${n.num_inscription}|${n.annee}`;

  async function load() {
    const data = await api.get('/api/notes' + qs({ num: $('#f-num').value, annee: $('#f-annee').value }));
    items = data.items;
    $('#effectif').textContent = data.effectif;
    $('#rows').innerHTML = items.length
      ? items
          .map(
            (n) => `<tr>
              <td>${esc(n.num_inscription)}</td><td>${esc(n.nom)}</td><td>${esc(n.annee)}</td>
              <td>${esc(n.libelle)}</td><td class="num">${fmt(n.coef)}</td><td class="num">${fmt(n.note)}</td>
              <td class="actions">
                <button class="btn small secondary" data-edit="${esc(keyOf(n))}">Modifier</button>
                <button class="btn small danger" data-del="${esc(keyOf(n))}">Supprimer</button>
              </td></tr>`
          )
          .join('')
      : '<tr><td colspan="7" class="empty">Aucune note trouvée.</td></tr>';
  }

  function resetForm() {
    editing = null;
    form.reset();
    form.annee.value = defaultAnnee();
    ['num', 'annee', 'codemat'].forEach((n) => (form[n].disabled = false));
    $('#form-title').textContent = 'Saisir une note';
    $('#cancel').hidden = true;
  }

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const note = Number(form.note.value);
    const ok = await safe(async () => {
      if (editing) {
        const { codemat, num, annee } = editing;
        await api.put(`/api/notes/${encodeURIComponent(codemat)}/${encodeURIComponent(num)}/${encodeURIComponent(annee)}`, { note });
      } else {
        await api.post('/api/notes', { num_inscription: form.num.value, annee: form.annee.value, codemat: form.codemat.value, note });
      }
      return true;
    });
    if (ok) {
      toast(editing ? 'Note modifiée' : 'Note enregistrée', 'success');
      resetForm();
      await safe(load);
    }
  });

  $('#cancel').addEventListener('click', resetForm);
  ['#f-num', '#f-annee'].forEach((s) => $(s).addEventListener('input', () => safe(load)));

  $('#rows').addEventListener('click', async (ev) => {
    const edit = ev.target.closest('[data-edit]');
    const del = ev.target.closest('[data-del]');
    if (edit) {
      const n = items.find((x) => keyOf(x) === edit.dataset.edit);
      editing = { codemat: n.codemat, num: n.num_inscription, annee: n.annee };
      form.num.value = n.num_inscription;
      form.annee.value = n.annee;
      form.codemat.value = n.codemat;
      form.note.value = n.note;
      ['num', 'annee', 'codemat'].forEach((k) => (form[k].disabled = true)); // seule la note se modifie
      $('#form-title').textContent = `Modifier la note de ${n.nom} en ${n.libelle}`;
      $('#cancel').hidden = false;
      form.note.focus();
    }
    if (del && confirm('Supprimer cette note ?')) {
      const n = items.find((x) => keyOf(x) === del.dataset.del);
      const ok = await safe(async () => {
        await api.del(`/api/notes/${encodeURIComponent(n.codemat)}/${encodeURIComponent(n.num_inscription)}/${encodeURIComponent(n.annee)}`);
        return true;
      });
      if (ok) { toast('Note supprimée', 'success'); await safe(load); }
    }
  });

  await load();
}
