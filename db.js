const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

// prefer an actual sqlite DB file (boss.db) but if only a SQL dump is present (boss.db.sql)
// import it on first run to create the real sqlite database automatically.
const dbFile = path.join(__dirname, 'boss.db');
const sqlDumpFile = path.join(__dirname, 'boss.db.sql');

let db;

// If there is no .db file but a .sql dump exists, import it into a new sqlite DB
if (!fs.existsSync(dbFile) && fs.existsSync(sqlDumpFile)) {
    console.log('No boss.db found, importing SQL dump from boss.db.sql...');
    const rawSql = fs.readFileSync(sqlDumpFile, 'utf8');

    // Convert common MySQL dump syntax to SQLite-friendly SQL
    let sql = rawSql
        .replace(/`/g, '') // remove MySQL backticks
        .replace(/INT\s+AUTO_INCREMENT\s+PRIMARY\s+KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT')
        .replace(/AUTO_INCREMENT/gi, 'AUTOINCREMENT')
        .replace(/\bBIGINT\b/gi, 'INTEGER')
        .replace(/ENGINE=[^;]*;?/gi, ';')
        .replace(/DEFAULT CHARSET=[^;]*;?/gi, ';')
        .replace(/\\r\\n/g, '\n');

    db = new sqlite3.Database(dbFile, (err) => {
        if (err) return console.error('Failed to create database file:', err);

        // Try to exec the whole SQL first
        db.exec(sql, (err2) => {
            if (!err2) {
                console.log('Imported boss.db.sql into boss.db (direct exec)');
                return;
            }

            // If exec failed (likely due to remaining incompatible statements),
            // attempt a statement-by-statement import and log any errors.
            console.warn('Direct import failed, attempting per-statement import:', err2.message);
            const statements = sql.split(/;\s*\n/).map(s => s.trim()).filter(Boolean);
            db.serialize(() => {
                statements.forEach(stmt => {
                    // Ignore empty or comment-only statements
                    if (!stmt || stmt.startsWith('--') || stmt.startsWith('/*')) return;
                    db.run(stmt + ';', (e) => {
                        if (e) {
                            console.warn('Statement failed (ignored):', e.message, '\n>>>', stmt.slice(0, 200));
                        }
                    });
                });
            });
            console.log('Attempted per-statement import from boss.db.sql (some statements may have been skipped).');
        });
    });
} else {
    db = new sqlite3.Database(dbFile);
}

function init() {
    db.serialize(() => {
        // ensure expected tables exist (no-op if already created by import)
        db.run(`
      CREATE TABLE IF NOT EXISTS provinces (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE,
        name TEXT,
        cost INTEGER
      )
    `);

        db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        description TEXT,
        price INTEGER,
        imageUrl TEXT,
        category TEXT
      )
    `);

        // seed provinces if empty
        db.get(`SELECT COUNT(*) as cnt FROM provinces`, (err, row) => {
            if (err) return console.error(err);
            if (row.cnt === 0) {
                const provinces = [
                    ['damascus', 'دمشق', 5000],
                    ['aleppo', 'حلب', 15000],
                    ['homs', 'حمص', 10000],
                    ['hama', 'حماة', 10000],
                    ['latakia', 'اللاذقية', 12000],
                    ['tartus', 'طرطوس', 12000],
                    ['daraa', 'درعا', 8000],
                    ['as-sweida', 'السويداء', 8000],
                    ['raqqa', 'الرقة', 20000],
                    ['deir-ez-zor', 'دير الزور', 25000],
                    ['al-hasakah', 'الحسكة', 25000],
                    ['idlib', 'إدلب', 15000],
                    ['rif-dimashq', 'ريف دمشق', 7000],
                    ['quneitra', 'القنيطرة', 10000]
                ];
                const stmt = db.prepare("INSERT INTO provinces (key, name, cost) VALUES (?, ?, ?)");
                provinces.forEach(p => stmt.run(p[0], p[1], p[2]));
                stmt.finalize();
                console.log('Seeded provinces');
            }
        });

        // seed sample product if empty
        db.get(`SELECT COUNT(*) as cnt FROM products`, (err, row) => {
            if (err) return console.error(err);
            if (row.cnt === 0) {
                const stmt = db.prepare("INSERT INTO products (name, description, price, imageUrl, category) VALUES (?, ?, ?, ?, ?)");
                stmt.run('منتج تجريبي', 'وصف المنتج التجريبي', 10000, 'https://via.placeholder.com/400x300', 'rice');
                stmt.finalize();
                console.log('Seeded sample product');
            }
        });
    });
}

module.exports = { db, init };
