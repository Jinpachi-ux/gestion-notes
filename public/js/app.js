import home from './pages/home.js';
import etudiants from './pages/etudiants.js';
import matieres from './pages/matieres.js';
import notes from './pages/notes.js';
import bulletin from './pages/bulletin.js';
import classement from './pages/classement.js';
import stats from './pages/stats.js';
import { safe } from './ui.js';

const routes = {
  '/': home,
  '/etudiants': etudiants,
  '/matieres': matieres,
  '/notes': notes,
  '/bulletin': bulletin,
  '/classement': classement,
  '/stats': stats,
};

const root = document.getElementById('app');

async function render() {
  const path = location.hash.slice(1) || '/';
  const page = routes[path] || home;
  document.querySelectorAll('#nav a').forEach((a) => a.classList.toggle('active', a.dataset.route === path));
  root.innerHTML = '';
  await safe(() => page(root));
}

window.addEventListener('hashchange', render);
render();
