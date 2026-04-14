import { Database } from "bun:sqlite";
import path from "path";

// Initialize bun sqlite. In dev it will be in the project root.
const dbPath = path.join(process.cwd(), "quizzes.sqlite");
export const sqliteDb = new Database(dbPath, { create: true });

// Setup schema
sqliteDb.query(`
  CREATE TABLE IF NOT EXISTS ollama_quizzes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unitId INTEGER NOT NULL,
    question TEXT NOT NULL,
    options TEXT NOT NULL,
    answerIndex INTEGER NOT NULL,
    explanation TEXT NOT NULL,
    meaning TEXT NOT NULL DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

export interface DbQuizQuestion {
  id: number;
  unitId: number;
  question: string;
  options: string; // JSON holding string array
  answerIndex: number;
  explanation: string;
  meaning: string;
}
