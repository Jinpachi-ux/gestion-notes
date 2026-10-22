// Crée la base et les tables (et, avec --seed, des données de démonstration).
//   npm run init-db
//   npm run seed
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
    charset: 'utf8mb4',
  });
  const files = ['schema.sql'];
  if (process.argv.includes('--seed')) files.push('seed.sql');
  for (const f of files) {
    const sql = fs.readFileSync(path.join(__dirname, '..', 'database', f), 'utf8');
    await conn.query(sql);
    console.log(`OK : ${f}`);
  }
  await conn.end();
}

main().catch((e) => {
  console.error('Échec :', e.message);
  console.error('Vérifiez que WampServer est démarré (icône verte) et que le fichier .env est correct.');
  process.exit(1);
});
