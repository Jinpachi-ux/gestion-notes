const router = require('express').Router();
const db = require('./db');
const calcul = require('./calcul');
const pdf = require('./pdf');

const NIVEAUX = ['L1', 'L2', 'L3', 'M1', 'M2'];
const ANNEE_RE = /^\d{4}-\d{4}$/;
const ID_RE = /^[A-Za-z0-9_\-]{1,15}$/;

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);
const str = (v) => (typeof v === 'string' ? v.trim() : '');
const round2 = (x) => Math.round(x * 100) / 100;

function need(cond, msg) {
  if (!cond) throw new HttpError(400, msg);
}
const checkId = (v, label) => need(ID_RE.test(v), `${label} invalide (lettres, chiffres, - ou _ ; 15 caractères max)`);
const checkAnnee = (v) => need(ANNEE_RE.test(v), 'Année invalide (format attendu : 2025-2026)');
const checkNiveau = (v) => need(NIVEAUX.includes(v), 'Niveau invalide (L1, L2, L3, M1 ou M2)');

/* ------------------------------------------------------------------ */
/*  Santé                                                              */
/* ------------------------------------------------------------------ */
router.get('/health', wrap(async (req, res) => {
  await db.query('SELECT 1');
  res.json({ ok: true, moteurCalcul: calcul.engine() });
}));

/* ------------------------------------------------------------------ */
/*  Étudiants                                                          */
/* ------------------------------------------------------------------ */
router.get('/etudiants', wrap(async (req, res) => {
  const { annee, niveau } = req.query;
  const q = str(req.query.q);
  const where = [];
  const params = [];
  if (annee) { checkAnnee(annee); where.push('annee = ?'); params.push(annee); }
  if (niveau) { checkNiveau(niveau); where.push('niveau = ?'); params.push(niveau); }
  if (q) {
    const like = `%${q.replace(/[\\%_]/g, '\\$&')}%`;
    where.push('(num_inscription LIKE ? OR nom LIKE ?)');
    params.push(like, like);
  }
  const [rows] = await db.query(
    `SELECT num_inscription, nom, niveau, annee FROM etudiant
     ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     ORDER BY nom, num_inscription`,
    params
  );
  res.json({ effectif: rows.length, items: rows });
}));

router.get('/etudiants/:num', wrap(async (req, res) => {
  const [rows] = await db.query('SELECT * FROM etudiant WHERE num_inscription = ?', [req.params.num]);
  if (!rows.length) throw new HttpError(404, 'Étudiant non trouvé');
  res.json(rows[0]);
}));

router.post('/etudiants', wrap(async (req, res) => {
  const num = str(req.body.num_inscription);
  const nom = str(req.body.nom);
  const { niveau, annee } = req.body;
  checkId(num, 'N° d\'inscription');
  need(nom.length > 0 && nom.length <= 100, 'Nom obligatoire (100 caractères max)');
  checkNiveau(niveau);
  checkAnnee(annee);
  const [exist] = await db.query('SELECT 1 FROM etudiant WHERE num_inscription = ?', [num]);
  if (exist.length) throw new HttpError(409, 'Étudiant déjà saisi');
  await db.query('INSERT INTO etudiant (num_inscription, nom, niveau, annee) VALUES (?, ?, ?, ?)', [num, nom, niveau, annee]);
  res.status(201).json({ num_inscription: num, nom, niveau, annee });
}));

router.put('/etudiants/:num', wrap(async (req, res) => {
  const nom = str(req.body.nom);
  const { niveau, annee } = req.body;
  need(nom.length > 0 && nom.length <= 100, 'Nom obligatoire (100 caractères max)');
  checkNiveau(niveau);
  checkAnnee(annee);
  const [r] = await db.query('UPDATE etudiant SET nom = ?, niveau = ?, annee = ? WHERE num_inscription = ?', [nom, niveau, annee, req.params.num]);
  if (!r.affectedRows) throw new HttpError(404, 'Étudiant non trouvé');
  res.json({ num_inscription: req.params.num, nom, niveau, annee });
}));

router.delete('/etudiants/:num', wrap(async (req, res) => {
  const [r] = await db.query('DELETE FROM etudiant WHERE num_inscription = ?', [req.params.num]);
  if (!r.affectedRows) throw new HttpError(404, 'Étudiant non trouvé');
  res.json({ ok: true });
}));

/* ------------------------------------------------------------------ */
/*  Matières (EC)                                                      */
/* ------------------------------------------------------------------ */
function checkMatiere(libelle, coef) {
  need(libelle.length > 0 && libelle.length <= 100, 'Libellé obligatoire (100 caractères max)');
  need(Number.isFinite(coef) && coef > 0 && coef <= 100, 'Le coefficient doit être un nombre strictement positif');
}

router.get('/matieres', wrap(async (req, res) => {
  const [rows] = await db.query('SELECT codemat, libelle, coef FROM matiere ORDER BY libelle');
  res.json({ effectif: rows.length, items: rows.map((r) => ({ ...r, coef: Number(r.coef) })) });
}));

router.post('/matieres', wrap(async (req, res) => {
  const codemat = str(req.body.codemat);
  const libelle = str(req.body.libelle);
  const coef = Number(req.body.coef);
  checkId(codemat, 'Code matière');
  checkMatiere(libelle, coef);
  const [exist] = await db.query('SELECT 1 FROM matiere WHERE codemat = ?', [codemat]);
  if (exist.length) throw new HttpError(409, 'Matière déjà saisie');
  await db.query('INSERT INTO matiere (codemat, libelle, coef) VALUES (?, ?, ?)', [codemat, libelle, coef]);
  res.status(201).json({ codemat, libelle, coef });
}));

router.put('/matieres/:code', wrap(async (req, res) => {
  const libelle = str(req.body.libelle);
  const coef = Number(req.body.coef);
  checkMatiere(libelle, coef);
  const [r] = await db.query('UPDATE matiere SET libelle = ?, coef = ? WHERE codemat = ?', [libelle, coef, req.params.code]);
  if (!r.affectedRows) throw new HttpError(404, 'Matière non trouvée');
  res.json({ codemat: req.params.code, libelle, coef });
}));

router.delete('/matieres/:code', wrap(async (req, res) => {
  const [r] = await db.query('DELETE FROM matiere WHERE codemat = ?', [req.params.code]);
  if (!r.affectedRows) throw new HttpError(404, 'Matière non trouvée');
  res.json({ ok: true });
}));

/* ------------------------------------------------------------------ */
/*  Notes                                                              */
/* ------------------------------------------------------------------ */
const checkNote = (n) => need(Number.isFinite(n) && n >= 0 && n <= 20, 'La note doit être comprise entre 0 et 20');

router.get('/notes', wrap(async (req, res) => {
  const { num, annee, codemat } = req.query;
  const where = [];
  const params = [];
  if (num) { where.push('n.num_inscription = ?'); params.push(num); }
  if (annee) { checkAnnee(annee); where.push('n.annee = ?'); params.push(annee); }
  if (codemat) { where.push('n.codemat = ?'); params.push(codemat); }
  const [rows] = await db.query(
    `SELECT n.codemat, m.libelle, m.coef, n.num_inscription, e.nom, n.annee, n.note
     FROM notes n
     JOIN matiere m ON m.codemat = n.codemat
     JOIN etudiant e ON e.num_inscription = n.num_inscription
     ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     ORDER BY n.annee DESC, e.nom, m.libelle`,
    params
  );
  res.json({
    effectif: rows.length,
    items: rows.map((r) => ({ ...r, coef: Number(r.coef), note: Number(r.note) })),
  });
}));

router.post('/notes', wrap(async (req, res) => {
  const codemat = str(req.body.codemat);
  const num = str(req.body.num_inscription);
  const { annee } = req.body;
  const note = Number(req.body.note);
  checkAnnee(annee);
  checkNote(note);
  const [etu] = await db.query('SELECT 1 FROM etudiant WHERE num_inscription = ?', [num]);
  if (!etu.length) throw new HttpError(404, 'Étudiant non trouvé');
  const [mat] = await db.query('SELECT 1 FROM matiere WHERE codemat = ?', [codemat]);
  if (!mat.length) throw new HttpError(404, 'Matière non trouvée');
  const [exist] = await db.query('SELECT 1 FROM notes WHERE codemat = ? AND num_inscription = ? AND annee = ?', [codemat, num, annee]);
  if (exist.length) throw new HttpError(409, 'Note déjà saisie pour cette matière (utilisez Modifier)');
  await db.query('INSERT INTO notes (codemat, num_inscription, annee, note) VALUES (?, ?, ?, ?)', [codemat, num, annee, note]);
  res.status(201).json({ codemat, num_inscription: num, annee, note });
}));

router.put('/notes/:codemat/:num/:annee', wrap(async (req, res) => {
  const note = Number(req.body.note);
  checkNote(note);
  const { codemat, num, annee } = req.params;
  const [r] = await db.query('UPDATE notes SET note = ? WHERE codemat = ? AND num_inscription = ? AND annee = ?', [note, codemat, num, annee]);
  if (!r.affectedRows) throw new HttpError(404, 'Note non trouvée');
  res.json({ codemat, num_inscription: num, annee, note });
}));

router.delete('/notes/:codemat/:num/:annee', wrap(async (req, res) => {
  const { codemat, num, annee } = req.params;
  const [r] = await db.query('DELETE FROM notes WHERE codemat = ? AND num_inscription = ? AND annee = ?', [codemat, num, annee]);
  if (!r.affectedRows) throw new HttpError(404, 'Note non trouvée');
  res.json({ ok: true });
}));

/* ------------------------------------------------------------------ */
/*  Bulletin                                                           */
/*   Étape 1 : recherche de l'étudiant                                 */
/*   Étape 2 : lecture de ses notes + coefficients des matières         */
/*   Étape 3 : moyenne générale = ΣNotePondérée / ΣCoef (module C++)    */
/* ------------------------------------------------------------------ */
async function buildBulletin(num, annee) {
  const [[etu]] = await db.query('SELECT num_inscription, nom, niveau, annee FROM etudiant WHERE num_inscription = ?', [num]);
  if (!etu) throw new HttpError(404, 'Étudiant non trouvé');
  const an = annee || etu.annee;
  checkAnnee(an);
  const [rows] = await db.query(
    `SELECT m.codemat, m.libelle, m.coef, n.note
     FROM notes n JOIN matiere m ON m.codemat = n.codemat
     WHERE n.num_inscription = ? AND n.annee = ?
     ORDER BY m.libelle`,
    [num, an]
  );
  const lignes = rows.map((r) => ({
    codemat: r.codemat,
    designation: r.libelle,
    coef: Number(r.coef),
    note: Number(r.note),
    notePonderee: round2(Number(r.note) * Number(r.coef)),
  }));
  const bulletin = { etudiant: etu, annee: an, lignes, sommePonderee: 0, sommeCoef: 0, moyenne: null, observation: null };
  if (lignes.length) {
    const res = await calcul.moyennes(lignes.map((l) => ({ idx: 0, note: l.note, coef: l.coef })));
    Object.assign(bulletin, res.get(0));
  }
  return bulletin;
}

router.get('/bulletin/:num', wrap(async (req, res) => {
  res.json(await buildBulletin(req.params.num, req.query.annee));
}));

router.get('/bulletin/:num/pdf', wrap(async (req, res) => {
  const b = await buildBulletin(req.params.num, req.query.annee);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="bulletin-${b.etudiant.num_inscription}-${b.annee}.pdf"`);
  pdf.bulletin(b, res);
}));

/* ------------------------------------------------------------------ */
/*  Classement par ordre de mérite et statistiques                     */
/* ------------------------------------------------------------------ */
async function moyennesPromotion(annee, niveau) {
  checkAnnee(annee);
  if (niveau) checkNiveau(niveau);
  const params = [annee, annee];
  let sql = `SELECT e.num_inscription, e.nom, e.niveau, n.note, m.coef
             FROM etudiant e
             JOIN notes n ON n.num_inscription = e.num_inscription AND n.annee = ?
             JOIN matiere m ON m.codemat = n.codemat
             WHERE e.annee = ?`;
  if (niveau) { sql += ' AND e.niveau = ?'; params.push(niveau); }
  sql += ' ORDER BY e.num_inscription';
  const [rows] = await db.query(sql, params);

  const students = [];
  const index = new Map();
  const lignes = [];
  for (const r of rows) {
    if (!index.has(r.num_inscription)) {
      index.set(r.num_inscription, students.length);
      students.push({ num_inscription: r.num_inscription, nom: r.nom, niveau: r.niveau });
    }
    lignes.push({ idx: index.get(r.num_inscription), note: Number(r.note), coef: Number(r.coef) });
  }
  const moy = await calcul.moyennes(lignes);
  return students.map((s, i) => ({ ...s, moyenne: moy.get(i).moyenne, observation: moy.get(i).observation }));
}

router.get('/classement', wrap(async (req, res) => {
  const { annee, niveau } = req.query;
  need(annee && niveau, 'Choisissez une année et un niveau');
  const items = await moyennesPromotion(annee, niveau);
  const rangs = await calcul.classement(items.map((it, i) => ({ idx: i, moyenne: it.moyenne })));
  res.json({
    annee, niveau,
    effectif: items.length,
    items: rangs.map((r) => ({ rang: r.rang, ...items[r.idx] })),
  });
}));

async function buildStats(annee, niveau) {
  need(annee, 'Choisissez une année');
  const items = await moyennesPromotion(annee, niveau);
  const s = await calcul.stats(items.map((i) => i.moyenne));
  const pct = (n) => (s.total ? Math.round((n / s.total) * 1000) / 10 : 0);
  return {
    annee, niveau: niveau || '',
    ...s,
    pctAdmis: pct(s.admis),
    pctRedoublant: pct(s.redoublant),
    pctExclus: pct(s.exclus),
  };
}

router.get('/stats', wrap(async (req, res) => {
  res.json(await buildStats(req.query.annee, req.query.niveau));
}));

router.get('/stats/pdf', wrap(async (req, res) => {
  const s = await buildStats(req.query.annee, req.query.niveau);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="statistiques-${s.annee}${s.niveau ? '-' + s.niveau : ''}.pdf"`);
  pdf.statistiques(s, res);
}));

module.exports = { router, HttpError };
