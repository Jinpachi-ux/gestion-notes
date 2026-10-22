import { api, qs } from '../api.js';
import { NIVEAUX, anneesList, defaultAnnee, esc, options, safe, toast } from '../ui.js';

export default async function etudiants(root) {
  let editing = null; // n° d'inscription en cours de modification

  root.innerHTML = `
    <h1>Gestion des étudiants</h1>

    <section class="card">
      <h2 id="form-title">Ajouter un étudiant</h2>
      <form id="form" class="grid">
        <label>N° d'inscription <input name="num_inscription" required maxlength="15" placeholder="E001"></label>
        <label>Nom <input name="nom" required maxlength="100"></label>
        <label>Niveau <select name="niveau" required>${options(NIVEAUX)}</select></label>
        <label>Année <select name="annee" required>${options(anneesList(), defaultAnnee())}</select></label>
        <div class="actions">
          <button class="btn" type="submit" id="submit">Enregistrer</button>
          <button class="btn secondary" type="button" id="cancel" hidden>Annuler</button>
        </div>
      </form>
    </section>

    <section class="card">
      <h2>Liste des étudiants</h2>
      <div class="toolbar">
        <label>Recherche (n° ou nom) <input id="q" placeholder="E001 ou Rivo"></label>
        <label>Année <select id="f-annee">${options(anneesList(), '', 'Toutes')}</select></label>
        <label>Niveau <select id="f-niveau">${options(NIVEAUX, '', 'Tous')}</select></label>
      </div>
      <p><strong>Effectif : <span id="effectif">0</span></strong></p>
      <div class="table-wrap">
        <table>
          <thead><tr><th>N° inscription</th><th>Nom</th><th>Niveau</th><th>Année</th><th></th></tr></thead>
          <tbody id="rows"></tbody>
        </table>
      </div>
    </section>`;

  const $ = (sel) => root.querySelector(sel);
  const form = $('#form');
  let items = [];

  async function load() {
    const data = await api.get('/api/etudiants' + qs({ q: $('#q').value.trim(), annee: $('#f-annee').value, niveau: $('#f-niveau').value }));
    items = data.items;
    $('#effectif').textContent = data.effectif;
    $('#rows').innerHTML = items.length
      ? items
          .map(
            (e) => `<tr>
              <td>${esc(e.num_inscription)}</td><td>${esc(e.nom)}</td><td>${esc(e.niveau)}</td><td>${esc(e.annee)}</td>
              <td class="actions">
                <button class="btn small secondary" data-edit="${esc(e.num_inscription)}">Modifier</button>
                <button class="btn small danger" data-del="${esc(e.num_inscription)}">Supprimer</button>
              </td></tr>`
          )
          .join('')
      : '<tr><td colspan="5" class="empty">Aucun étudiant trouvé.</td></tr>';
  }

  function resetForm() {
    editing = null;
    form.reset();
    form.annee.value = defaultAnnee();
    form.num_inscription.readOnly = false;
    $('#form-title').textContent = 'Ajouter un étudiant';
    $('#cancel').hidden = true;
  }

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const body = {
      num_inscription: form.num_inscription.value.trim(),
      nom: form.nom.value.trim(),
      niveau: form.niveau.value,
      annee: form.annee.value,
    };
    const ok = await safe(async () => {
      if (editing) await api.put(`/api/etudiants/${encodeURIComponent(editing)}`, body);
      else await api.post('/api/etudiants', body);
      return true;
    });
    if (ok) {
      toast(editing ? 'Étudiant modifié' : 'Étudiant ajouté', 'success');
      resetForm();
      await safe(load);
    }
  });

  $('#cancel').addEventListener('click', resetForm);
  ['#q', '#f-annee', '#f-niveau'].forEach((s) => $(s).addEventListener('input', () => safe(load)));

  $('#rows').addEventListener('click', async (ev) => {
    const edit = ev.target.closest('[data-edit]');
    const del = ev.target.closest('[data-del]');
    if (edit) {
      const e = items.find((x) => x.num_inscription === edit.dataset.edit);
      editing = e.num_inscription;
      form.num_inscription.value = e.num_inscription;
      form.num_inscription.readOnly = true;
      form.nom.value = e.nom;
      form.niveau.value = e.niveau;
      form.annee.value = e.annee;
      $('#form-title').textContent = `Modifier l'étudiant ${e.num_inscription}`;
      $('#cancel').hidden = false;
      form.nom.focus();
    }
    if (del && confirm(`Supprimer l'étudiant ${del.dataset.del} et toutes ses notes ?`)) {
      const ok = await safe(async () => { await api.del(`/api/etudiants/${encodeURIComponent(del.dataset.del)}`); return true; });
      if (ok) { toast('Étudiant supprimé', 'success'); await safe(load); }
    }
  });

  await load();
}
