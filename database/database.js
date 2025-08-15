import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_FILE = join(__dirname, 'research.db');

sqlite3.verbose();

const getDbConnection = () => {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_FILE, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(db);
            }
        });
    });
}

export const createResearchPlansTable = async () => {
    const db = await getDbConnection();
    return new Promise((resolve, reject) => {
        db.run(`
            CREATE TABLE IF NOT EXISTS research_plans (
                id INTEGER PRIMARY KEY,
                short_summary TEXT NOT NULL,
                details TEXT NOT NULL
            )
        `, (err) => {
            db.close();
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

export const getResearchPlans = async () => {
    const db = await getDbConnection();
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM research_plans", (err, rows) => {
            db.close();
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

export const addResearchPlan = async (shortSummary, details) => {
    const db = await getDbConnection();
    return new Promise((resolve, reject) => {
        db.run(
            "INSERT INTO research_plans (short_summary, details) VALUES (?, ?)",
            [shortSummary, details],
            function(err) {
                db.close();
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        id: this.lastID,
                        short_summary: shortSummary,
                        details: details
                    });
                }
            }
        );
    });
}

export const deleteResearchPlan = async (researchPlanId) => {
    const db = await getDbConnection();
    return new Promise((resolve, reject) => {
        db.run(
            "DELETE FROM research_plans WHERE id = ?",
            [researchPlanId],
            (err) => {
                db.close();
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            }
        );
    });
}

export const initDb = async () => {
    await createResearchPlansTable();
}
