import { sqliteDb } from "./db";
import { ollamaService } from "../core/ollama";

// A simple in-memory lock to prevent multiple background workers from spawning at once.
let isGenerating = false;

export async function generateBackgroundQuizzes(unitIds: number[]) {
  if (isGenerating) return;
  isGenerating = true;

  console.log(`[Worker] Starting background generation of 100 questions for units ${unitIds}...`);

  try {
    // Generate batches of 10, total 100
    for (let i = 0; i < 10; i++) {
        console.log(`[Worker] Generating batch ${i+1}/10...`);
        try {
            const result = await ollamaService.generateQuiz(unitIds, 10);
            
            // Insert into SQLite
            const insertStmt = sqliteDb.prepare(`
                INSERT INTO ollama_quizzes (unitId, question, options, answerIndex, explanation, meaning)
                VALUES (?, ?, ?, ?, ?, ?)
            `);
            
            const trx = sqliteDb.transaction(() => {
                for (const q of result.questions) {
                    // Use model's unitId if it's in our requested list, otherwise fallback to random assignment
                    const assignmentUnit = unitIds.includes(q.unitId) 
                        ? q.unitId 
                        : unitIds[Math.floor(Math.random() * unitIds.length)]!;

                    insertStmt.run(
                        assignmentUnit,
                        q.question,
                        JSON.stringify(q.options),
                        q.answerIndex,
                        q.explanation || "",
                        q.meaning || ""
                    );
                }
            });
            
            trx();
            console.log(`[Worker] Inserted ${result.questions.length} questions into DB.`);
        } catch (err) {
            console.error(`[Worker] Batch ${i+1} failed:`, err);
        }
    }
  } catch (globalErr) {
    console.error("[Worker] Global error in background generation", globalErr);
  } finally {
    isGenerating = false;
    console.log("[Worker] Background generation finished.");
  }
}
