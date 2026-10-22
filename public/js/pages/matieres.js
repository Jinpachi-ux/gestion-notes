import { api } from '../api.js';
import { esc, fmt, safe, toast } from '../ui.js';

export default async function matieres(root) {
  let editing = null; // code de la matière en cours de modification

  root.innerHTML = `
    <h1>Gestion des matières</h1>

    <section class="card">
      <h2 id="form-title">Ajouter une matière</h2>
      <form id="form" class="grid">
        <label>Code matière <input name="codemat" required maxlength="15" placeholder="MAT01"></label>
        <label>Libellé <input name="libelle" required maxlength="100" placeholder="Maths"></label>
        <label>Coefficient <input name="coef" type="number" min="0.5" step="0.5" required value="1"></label>
        <div class="actions">
          <button class="btn" type="submit">Enregistrer</button>
          <button class="btn secondary" type="button" id="cancel" hidden>Annuler</button>
        </div>
      </form>
    </section>

    <section class="card">
      <h2>Liste des matières</h2>
      <p><strong>Effectif : <span id="effectif">0</span></strong></p>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Code</th><th>Libellé</th><th class="num">Coef</th><th></th></tr></thead>
          <tbody id="rows"></tbody>
        </table>
      </div>
    </section>`;

  const $ = (sel) => root.querySelector(sel);
  const form = $('#form');
  let items = [];

  async function load() {
    const data = await api.get('/api/matieres');
    items = data.items;
    $('#effectif').textContent = data.effectif;
    $('#rows').innerHTML = items.length
      ? items
          .map(
            (m) => `<tr>
              <td>${esc(m.codemat)}</td><td>${esc(m.libelle)}</td><td class="num">${fmt(m.coef)}</td>
              <td class="actions">
                <button class="btn small secondary" data-edit="${esc(m.codemat)}">Modifier</button>
                <button class="btn small danger" data-del="${esc(m.codemat)}">Supprimer</button>
              </td></tr>`
          )
          .join('')
      : '<tr><td colspan="4" class="empty">Aucune matière enregistrée.</td></tr>';
  }

  function resetForm() {
    editing = null;
    form.reset();
    form.codemat.readOnly = false;
    $('#form-title').textContent = 'Ajouter une matière';
    $('#cancel').hidden = true;
  }

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const body = { codemat: form.codemat.value.trim(), libelle: form.libelle.value.trim(), coef: Number(form.coef.value) };
    const ok = await safe(async () => {
      if (editing) await api.put(`/api/matieres/${encodeURIComponent(editing)}`, body);
      else await api.post('/api/matieres', body);
      return true;
    });
    if (ok) {
      toast(editing ? 'Matière modifiée' : 'Matière ajoutée', 'success');
      resetForm();
      await safe(load);
    }
  });

  $('#cancel').addEventListener('click', resetForm);

  $('#rows').addEventListener('click', async (ev) => {
    const edit = ev.target.closest('[data-edit]');
    const del = ev.target.closest('[data-del]');
    if (edit) {
      const m = items.find((x) => x.codemat === edit.dataset.edit);
      editing = m.codemat;
      form.codemat.value = m.codemat;
      form.codemat.readOnly = true;
      form.libelle.value = m.libelle;
      form.coef.value = m.coef;
      $('#form-title').textContent = `Modifier la matière ${m.codemat}`;
      $('#cancel').hidden = false;
      form.libelle.focus();
    }
    if (del && confirm(`Supprimer la matière ${del.dataset.del} ?`)) {
      const ok = await safe(async () => { await api.del(`/api/matieres/${encodeURIComponent(del.dataset.del)}`); return true; });
      if (ok) { toast('Matière supprimée', 'success'); await safe(load); }
    }
  });

  await load();
}
