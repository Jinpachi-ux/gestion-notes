# Projet 1 : Gestion des notes

Application web de gestion des étudiants, des matières (EC) et des notes, avec édition de bulletins,
classement par ordre de mérite, statistiques (histogramme / camembert) et export PDF.

| Couche | Technologies |
|---|---|
| Front-end | HTML, CSS, JavaScript (DOM dynamique, modules ES, SVG pour les graphiques) |
| Back-end | Node.js + Express, module de calcul en C++ appelé par Node |
| Base de données | MySQL via WampServer |
| DevOps | Git, GitHub, GitLab |

## 1. Prérequis

- **WampServer** démarré (icône verte), avec MySQL 8 ou MariaDB 10.4+.
- **Node.js 18 ou plus** (https://nodejs.org).
- *(Facultatif)* un compilateur **g++** (MinGW sous Windows, ou celui de MSYS2) pour compiler le module C++.
  Sans lui, l'application utilise automatiquement une version JavaScript équivalente des calculs.

## 2. Installation

```bash
npm install                 # installe express, mysql2, pdfkit, dotenv
copy .env.example .env      # (Linux/macOS : cp .env.example .env) puis adapter si besoin
npm run init-db             # crée la base gestion_notes et les 3 tables
npm run seed                # (facultatif) données de démonstration
npm run build:cpp           # (facultatif) compile cpp/calcul.cpp
npm test                    # (facultatif) vérifie que C++ et JS donnent les mêmes résultats
npm start                   # lance le serveur
```

Ouvrir ensuite http://localhost:3000.
Le moteur de calcul utilisé (C++ ou JavaScript) s'affiche dans la console au démarrage.

> Le script `database/schema.sql` crée la base `gestion_notes`. Si vous changez `DB_NAME`
> dans `.env`, modifiez aussi les deux premières lignes de `schema.sql` et la ligne `USE` de `seed.sql`.

## 3. Structure du projet

```
gestion-notes/
├── database/
│   ├── schema.sql        tables ETUDIANT, MATIERE, NOTES
│   └── seed.sql          données de démonstration
├── cpp/
│   └── calcul.cpp        moyennes, observations, classement, statistiques
├── server/
│   ├── index.js          serveur Express, gestion des erreurs
│   ├── routes.js         API REST
│   ├── calcul.js         pont Node <-> C++ (avec repli JavaScript)
│   ├── pdf.js            bulletin et statistiques en PDF
│   ├── db.js             connexion MySQL
│   ├── init-db.js        création de la base
│   └── selftest.js       test du moteur de calcul
└── public/               interface (HTML, CSS, JS)
    └── js/pages/         une page par entrée du menu principal
```

## 4. Correspondance avec le sujet

| Exigence du sujet | Réalisation |
|---|---|
| Fichiers ETUDIANT, MATIERE, NOTES | 3 tables MySQL (`database/schema.sql`), clés primaires et clés étrangères |
| Niveau = liste de choix (L1, L2, L3, M1, M2) | `ENUM` en base, liste déroulante dans le formulaire |
| Création, listage, mise à jour (ajout, suppression, modification) | Pages Étudiants, Matières, Notes |
| Messages « Étudiant déjà saisi » / « Étudiant non trouvé » | Renvoyés par l'API et affichés dans l'interface |
| Recherche d'un étudiant par numéro ou nom | Champ de recherche de la page Étudiants |
| Liste des étudiants par niveau et année, avec l'effectif | Filtres année et niveau, effectif affiché |
| Formulaire Inscription : année en liste déroulante | Page Étudiants |
| Formulaire Notes : n° d'inscription et année en listes déroulantes | Page Notes |
| Bulletin des notes (étapes 1, 2, 3) | Page Bulletin, calcul Σ(note × coef) / Σ coef |
| Observation : ADMIS ≥ 10, REDOUBLANT ≥ 7,5, EXCLUS < 7,5 | `cpp/calcul.cpp` (et équivalent JS) |
| Classement par ordre de mérite, par niveau et année | Page Classement (ex æquo : même rang) |
| Menu principal | Page d'accueil |
| Histogramme ou camembert + PDF | Page Statistiques (les deux graphiques) + export PDF |

**Choix à connaître :** la moyenne est arrondie à 2 décimales *avant* de déterminer l'observation,
pour que la valeur affichée et l'observation soient toujours cohérentes. Le sujet mentionne deux
règles (ADMIS/ECHEC à l'étape 3, ADMIS/REDOUBLANT/EXCLUS dans les résultats) : j'ai retenu les trois
états, qui incluent le cas « ECHEC ». Si votre enseignant exige strictement ADMIS/ECHEC sur le
bulletin, il suffit de modifier la fonction `observation` dans `cpp/calcul.cpp` et `server/calcul.js`.

## 5. API REST

| Méthode et chemin | Rôle |
|---|---|
| `GET /api/etudiants?q=&annee=&niveau=` | Liste + effectif |
| `POST /api/etudiants` | Ajouter (409 si déjà saisi) |
| `PUT /api/etudiants/:num` | Modifier (404 si non trouvé) |
| `DELETE /api/etudiants/:num` | Supprimer, notes comprises |
| `GET/POST /api/matieres`, `PUT/DELETE /api/matieres/:code` | Gestion des matières |
| `GET/POST /api/notes`, `PUT/DELETE /api/notes/:codemat/:num/:annee` | Gestion des notes |
| `GET /api/bulletin/:num?annee=` | Bulletin (JSON) |
| `GET /api/bulletin/:num/pdf?annee=` | Bulletin (PDF) |
| `GET /api/classement?annee=&niveau=` | Classement |
| `GET /api/stats?annee=&niveau=` | Statistiques |
| `GET /api/stats/pdf?annee=&niveau=` | Statistiques (PDF) |

## 6. Git, GitHub et GitLab

```bash
git init
git add .
git commit -m "Projet 1 : gestion des notes"
git branch -M main
git remote add origin https://github.com/<utilisateur>/gestion-notes.git
git push -u origin main
# Pour un miroir GitLab :
git remote add gitlab https://gitlab.com/<utilisateur>/gestion-notes.git
git push gitlab main
```

Le fichier `.gitignore` exclut `node_modules/`, `.env` et l'exécutable C++ compilé.

## 7. Maquette Figma

La maquette Figma n'est pas incluse. Les sept écrans à dessiner correspondent aux pages de
`public/js/pages/` : menu principal, étudiants, matières, notes, bulletin, classement, statistiques.
