-- Projet 1 : Gestion des notes
-- Modèle relationnel (MySQL / MariaDB, WampServer)
--
--   ETUDIANT(num_inscription, nom, niveau, annee)
--   MATIERE(codemat, libelle, coef)
--   NOTES(codemat, num_inscription, annee, note)

CREATE DATABASE IF NOT EXISTS gestion_notes
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gestion_notes;

CREATE TABLE IF NOT EXISTS etudiant (
  num_inscription VARCHAR(15)  NOT NULL,
  nom             VARCHAR(100) NOT NULL,
  niveau          ENUM('L1','L2','L3','M1','M2') NOT NULL,
  annee           VARCHAR(9)   NOT NULL,            -- ex. 2025-2026
  PRIMARY KEY (num_inscription)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS matiere (
  codemat VARCHAR(15)  NOT NULL,
  libelle VARCHAR(100) NOT NULL,
  coef    DECIMAL(5,2) NOT NULL,
  PRIMARY KEY (codemat)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notes (
  codemat         VARCHAR(15)  NOT NULL,
  num_inscription VARCHAR(15)  NOT NULL,
  annee           VARCHAR(9)   NOT NULL,
  note            DECIMAL(5,2) NOT NULL,
  PRIMARY KEY (codemat, num_inscription, annee),
  CONSTRAINT fk_notes_matiere  FOREIGN KEY (codemat)
    REFERENCES matiere (codemat)       ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_notes_etudiant FOREIGN KEY (num_inscription)
    REFERENCES etudiant (num_inscription) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;
