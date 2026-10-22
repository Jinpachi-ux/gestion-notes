// Menu principal de l'application
export default async function home(root) {
  const entries = [
    ['1', '#/etudiants', 'Gestion et listage des étudiants', 'Ajout, modification, suppression, recherche'],
    ['2', '#/matieres', 'Gestion et listage des matières', 'Code, libellé et coefficient'],
    ['3', '#/notes', 'Gestion et listage des notes', 'Saisie par étudiant, matière et année'],
    ['4', '#/bulletin', 'Édition d\'un bulletin des notes', 'Moyenne, observation, export PDF'],
    ['5', '#/classement', 'Classement par ordre de mérite', 'Par niveau et par année'],
    ['6', '#/stats', 'Statistiques des résultats', 'Histogramme, camembert, PDF'],
  ];
  root.innerHTML = `
    <h1>Menu principal</h1>
    <div class="menu">
      ${entries
        .map(([n, href, title, sub]) => `<a href="${href}"><span class="num">${n}</span><span>${title}<small>${sub}</small></span></a>`)
        .join('')}
    </div>`;
}
