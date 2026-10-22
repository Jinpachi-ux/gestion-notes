// Génération des PDF (bulletin de notes, statistiques) avec PDFKit.
const PDFDocument = require('pdfkit');

const fmt = (n) => (n === null || n === undefined ? '' : Number(n).toFixed(2).replace(/\.00$/, ''));

function drawRow(doc, x, y, widths, cells, { bold = false, fill = null, aligns = [] } = {}) {
  const h = 24;
  let cx = x;
  doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(11);
  cells.forEach((text, i) => {
    if (fill) doc.rect(cx, y, widths[i], h).fillAndStroke(fill, '#444');
    else doc.rect(cx, y, widths[i], h).stroke('#444');
    doc.fillColor('#000').text(String(text ?? ''), cx + 6, y + 7, {
      width: widths[i] - 12,
      align: aligns[i] || 'left',
      lineBreak: false,
    });
    cx += widths[i];
  });
  return y + h;
}

function bulletin(b, stream) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.pipe(stream);

  doc.font('Helvetica-Bold').fontSize(20).text('BULLETIN DES NOTES', { align: 'center' });
  doc.moveDown(1.5);
  doc.font('Helvetica').fontSize(12);
  doc.text(`N°ETUDIANT : ${b.etudiant.num_inscription}`);
  doc.text(`NOM : ${b.etudiant.nom}`);
  doc.text(`NIVEAU : ${b.etudiant.niveau}`);
  doc.text(`ANNEE : ${b.annee}`);

  const x = 50;
  const widths = [210, 55, 100, 130];
  let y = doc.y + 20;
  y = drawRow(doc, x, y, widths, ['DESIGNATION', 'COEF', 'NOTE', 'NOTE PONDEREE'], {
    bold: true,
    fill: '#e8e8e8',
    aligns: ['left', 'center', 'center', 'center'],
  });
  for (const l of b.lignes) {
    if (y > 740) {
      doc.addPage();
      y = 50;
    }
    y = drawRow(doc, x, y, widths, [l.designation, fmt(l.coef), fmt(l.note), fmt(l.notePonderee)], {
      aligns: ['left', 'center', 'center', 'center'],
    });
  }
  // lignes de synthèse alignées sur les deux dernières colonnes
  const sx = x + widths[0] + widths[1];
  const sw = [widths[2], widths[3]];
  y = drawRow(doc, sx, y, sw, ['MOYENNE', b.moyenne === null ? '-' : fmt(b.moyenne)], { bold: true, aligns: ['left', 'center'] });
  drawRow(doc, sx, y, sw, ['OBSERVATION', b.observation || 'Aucune note'], { bold: true, aligns: ['left', 'center'] });

  doc.end();
}

function statistiques(s, stream) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.pipe(stream);

  doc.font('Helvetica-Bold').fontSize(20).text('STATISTIQUES DES RÉSULTATS', { align: 'center' });
  doc.moveDown();
  doc.font('Helvetica').fontSize(12);
  doc.text(`Année : ${s.annee}`);
  doc.text(`Niveau : ${s.niveau || 'Tous'}`);
  doc.text(`Effectif évalué : ${s.total}`);

  const cats = [
    { label: 'Admis (moyenne >= 10)', n: s.admis, p: s.pctAdmis, color: '#2e7d32' },
    { label: 'Redoublants (7.5 <= moyenne < 10)', n: s.redoublant, p: s.pctRedoublant, color: '#f9a825' },
    { label: 'Exclus (moyenne < 7.5)', n: s.exclus, p: s.pctExclus, color: '#c62828' },
  ];

  let y = doc.y + 20;
  y = drawRow(doc, 50, y, [270, 100, 120], ['Catégorie', 'Effectif', 'Pourcentage'], {
    bold: true,
    fill: '#e8e8e8',
    aligns: ['left', 'center', 'center'],
  });
  for (const c of cats) {
    y = drawRow(doc, 50, y, [270, 100, 120], [c.label, c.n, `${c.p} %`], { aligns: ['left', 'center', 'center'] });
  }

  // Histogramme
  const baseY = y + 270;
  const maxH = 200;
  const bx = 110;
  const bw = 80;
  const gap = 50;
  doc.font('Helvetica-Bold').fontSize(13).fillColor('#000').text('Histogramme (% d\'étudiants)', 50, y + 25);
  doc.moveTo(bx - 20, baseY).lineTo(bx + 3 * bw + 2 * gap + 20, baseY).stroke('#000');
  doc.moveTo(bx - 20, baseY - maxH - 10).lineTo(bx - 20, baseY).stroke('#000');
  doc.font('Helvetica').fontSize(10);
  cats.forEach((c, i) => {
    const h = (c.p / 100) * maxH;
    const x = bx + i * (bw + gap);
    doc.rect(x, baseY - h, bw, h).fill(c.color);
    doc.fillColor('#000').text(`${c.p} %`, x, baseY - h - 14, { width: bw, align: 'center' });
    doc.text(['Admis', 'Redoublants', 'Exclus'][i], x - 10, baseY + 6, { width: bw + 20, align: 'center' });
  });

  doc.end();
}

module.exports = { bulletin, statistiques };
