-- Données de démonstration (facultatif) : npm run seed
USE gestion_notes;

INSERT IGNORE INTO matiere (codemat, libelle, coef) VALUES
  ('MAT01', 'Maths',    3),
  ('PHY01', 'Physique', 2);

INSERT IGNORE INTO etudiant (num_inscription, nom, niveau, annee) VALUES
  ('E001', 'Rivo',  'L1', '2025-2026'),
  ('E002', 'Hanta', 'L1', '2025-2026'),
  ('E003', 'Soa',   'L1', '2025-2026'),
  ('E004', 'Jean',  'L1', '2025-2026'),
  ('E005', 'Tiana', 'L1', '2025-2026');

INSERT IGNORE INTO notes (codemat, num_inscription, annee, note) VALUES
  ('MAT01', 'E001', '2025-2026', 15), ('PHY01', 'E001', '2025-2026', 15),
  ('MAT01', 'E002', '2025-2026',  8), ('PHY01', 'E002', '2025-2026',  6),
  ('MAT01', 'E003', '2025-2026',  9), ('PHY01', 'E003', '2025-2026',  8),
  ('MAT01', 'E004', '2025-2026', 16), ('PHY01', 'E004', '2025-2026', 16),
  ('MAT01', 'E005', '2025-2026', 10), ('PHY01', 'E005', '2025-2026', 10);
