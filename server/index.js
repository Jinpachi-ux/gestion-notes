require('dotenv').config();
const express = require('express');
const path = require('path');
const { router } = require('./routes');
const calcul = require('./calcul');

const app = express();
app.use(express.json());

app.use('/api', router);
app.use('/api', (req, res) => res.status(404).json({ error: 'Ressource introuvable' }));

app.use(express.static(path.join(__dirname, '..', 'public')));

// Gestion centralisée des erreurs
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err.status) return res.status(err.status).json({ error: err.message });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON invalide' });
  switch (err.code) {
    case 'ER_DUP_ENTRY':
      return res.status(409).json({ error: 'Enregistrement déjà existant' });
    case 'ER_ROW_IS_REFERENCED_2':
      return res.status(409).json({ error: 'Suppression impossible : des notes utilisent cette matière' });
    case 'ER_NO_REFERENCED_ROW_2':
      return res.status(400).json({ error: 'Étudiant ou matière inexistant' });
    case 'ECONNREFUSED':
    case 'ER_BAD_DB_ERROR':
    case 'ER_NO_SUCH_TABLE':
    case 'ER_ACCESS_DENIED_ERROR':
      console.error(err);
      return res.status(503).json({ error: 'Base de données indisponible. Vérifiez WampServer, le fichier .env et « npm run init-db ».' });
    default:
      console.error(err);
      return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`Gestion des notes : http://localhost:${port}  (moteur de calcul : ${calcul.engine()})`);
});
