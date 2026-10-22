// Pont entre Node.js et le programme C++ (cpp/calcul).
// Si l'exécutable n'est pas compilé (ou si FORCE_JS=1), on utilise une version
// JavaScript strictement équivalente : l'application fonctionne dans les deux cas.
require('dotenv').config();
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const EXE = path.join(__dirname, '..', 'cpp', process.platform === 'win32' ? 'calcul.exe' : 'calcul');

const arrondi2 = (x) => Math.round(x * 100) / 100;

function observation(moyenne) {
  if (moyenne >= 10) return 'ADMIS';
  if (moyenne >= 7.5) return 'REDOUBLANT';
  return 'EXCLUS';
}

/* ---------- Version JavaScript (repli) ---------- */

function jsMoyennes(rows) {
  const acc = new Map();
  for (const { idx, note, coef } of rows) {
    if (!acc.has(idx)) acc.set(idx, { sp: 0, sc: 0 });
    const a = acc.get(idx);
    a.sp += note * coef;
    a.sc += coef;
  }
  const out = new Map();
  for (const [idx, { sp, sc }] of acc) {
    const moyenne = sc > 0 ? arrondi2(sp / sc) : 0;
    out.set(idx, {
      sommePonderee: arrondi2(sp),
      sommeCoef: arrondi2(sc),
      moyenne,
      observation: observation(moyenne),
    });
  }
  return out;
}

function jsClassement(items) {
  const tri = items.slice().sort((a, b) => b.moyenne - a.moyenne); // tri stable
  return tri.map((it) => ({
    rang: 1 + items.filter((o) => o.moyenne > it.moyenne).length,
    idx: it.idx,
    moyenne: it.moyenne,
  }));
}

function jsStats(moyennes) {
  const r = { admis: 0, redoublant: 0, exclus: 0 };
  for (const m of moyennes) {
    const o = observation(m);
    if (o === 'ADMIS') r.admis++;
    else if (o === 'REDOUBLANT') r.redoublant++;
    else r.exclus++;
  }
  r.total = r.admis + r.redoublant + r.exclus;
  return r;
}

/* ---------- Appel du programme C++ ---------- */

const hasNative = () => process.env.FORCE_JS !== '1' && fs.existsSync(EXE);

function runNative(mode, lines) {
  return new Promise((resolve, reject) => {
    const child = spawn(EXE, [], { stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0
        ? resolve(out.split('\n').filter(Boolean))
        : reject(new Error(err.trim() || `calcul a retourné le code ${code}`))
    );
    child.stdin.end([mode, ...lines].join('\n') + '\n');
  });
}

async function withFallback(native, fallback) {
  if (!hasNative()) return fallback();
  try {
    return await native();
  } catch (e) {
    console.warn('[calcul] C++ indisponible, repli sur JavaScript :', e.message);
    return fallback();
  }
}

/** rows : [{ idx, note, coef }] -> Map idx -> { sommePonderee, sommeCoef, moyenne, observation } */
function moyennes(rows) {
  if (!rows.length) return Promise.resolve(new Map());
  return withFallback(
    async () => {
      const lines = await runNative('moyennes', rows.map((r) => `${r.idx};${r.note};${r.coef}`));
      const out = new Map();
      for (const l of lines) {
        const [idx, sp, sc, m, obs] = l.split(';');
        out.set(Number(idx), {
          sommePonderee: Number(sp),
          sommeCoef: Number(sc),
          moyenne: Number(m),
          observation: obs,
        });
      }
      return out;
    },
    () => jsMoyennes(rows)
  );
}

/** items : [{ idx, moyenne }] -> [{ rang, idx, moyenne }] trié par moyenne décroissante */
function classement(items) {
  if (!items.length) return Promise.resolve([]);
  return withFallback(
    async () => {
      const lines = await runNative('classement', items.map((i) => `${i.idx};${i.moyenne}`));
      return lines.map((l) => {
        const [rang, idx, m] = l.split(';');
        return { rang: Number(rang), idx: Number(idx), moyenne: Number(m) };
      });
    },
    () => jsClassement(items)
  );
}

/** moyennes : [nombre] -> { admis, redoublant, exclus, total } */
function stats(moys) {
  if (!moys.length) return Promise.resolve({ admis: 0, redoublant: 0, exclus: 0, total: 0 });
  return withFallback(
    async () => {
      const [l] = await runNative('stats', moys.map(String));
      const [a, r, e, t] = l.split(';').map(Number);
      return { admis: a, redoublant: r, exclus: e, total: t };
    },
    () => jsStats(moys)
  );
}

const engine = () => (hasNative() ? 'C++' : 'JavaScript');

module.exports = { moyennes, classement, stats, engine, hasNative, runNative, jsMoyennes, jsClassement, jsStats };
