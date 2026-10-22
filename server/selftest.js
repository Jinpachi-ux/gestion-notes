// Auto-test du moteur de calcul : compare la version C++ (si compilée) à la version JS.
//   npm run build:cpp && npm test
const assert = require('assert');
const c = require('./calcul');

const rows = [
  // Exemple du sujet : Maths coef 3 note 10, Physique coef 2 note 10 -> moyenne 10 (ADMIS)
  { idx: 0, note: 10, coef: 3 }, { idx: 0, note: 10, coef: 2 },
  { idx: 1, note: 16, coef: 3 }, { idx: 1, note: 16, coef: 2 },
  { idx: 2, note: 8, coef: 3 },  { idx: 2, note: 6, coef: 2 },   // 7.2 -> EXCLUS
  { idx: 3, note: 9, coef: 3 },  { idx: 3, note: 8, coef: 2 },   // 8.6 -> REDOUBLANT
  { idx: 4, note: 7.5, coef: 1 },                                  // limite 7.5 -> REDOUBLANT
];

(async () => {
  const js = c.jsMoyennes(rows);
  assert.strictEqual(js.get(0).moyenne, 10);
  assert.strictEqual(js.get(0).observation, 'ADMIS');
  assert.strictEqual(js.get(0).sommePonderee, 50);
  assert.strictEqual(js.get(2).moyenne, 7.2);
  assert.strictEqual(js.get(2).observation, 'EXCLUS');
  assert.strictEqual(js.get(3).observation, 'REDOUBLANT');
  assert.strictEqual(js.get(4).observation, 'REDOUBLANT');

  const cl = c.jsClassement([...js].map(([idx, v]) => ({ idx, moyenne: v.moyenne })));
  assert.deepStrictEqual(cl.map((x) => x.idx), [1, 0, 3, 4, 2]);
  assert.deepStrictEqual(cl.map((x) => x.rang), [1, 2, 3, 4, 5]);

  const st = c.jsStats([...js.values()].map((v) => v.moyenne));
  assert.deepStrictEqual(st, { admis: 2, redoublant: 2, exclus: 1, total: 5 });
  console.log('JS  : OK');

  if (!c.hasNative()) {
    console.log('C++ : non compilé (npm run build:cpp), test ignoré');
    return;
  }
  const nat = await c.moyennes(rows);
  assert.deepStrictEqual([...nat], [...js]);
  const natCl = await c.classement([...js].map(([idx, v]) => ({ idx, moyenne: v.moyenne })));
  assert.deepStrictEqual(natCl, cl);
  const natSt = await c.stats([...js.values()].map((v) => v.moyenne));
  assert.deepStrictEqual(natSt, st);
  console.log('C++ : OK (résultats identiques à la version JS)');
})().catch((e) => {
  console.error('ÉCHEC :', e.message);
  process.exit(1);
});
