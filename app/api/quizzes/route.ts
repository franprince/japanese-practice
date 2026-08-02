import { NextResponse } from "next/server";
import { sqliteDb } from "@/lib/server/db";
import { generateBackgroundQuizzes } from "@/lib/server/quiz-worker";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { selectedUnitIds, seenIds = [] } = body;

    if (!selectedUnitIds || !Array.isArray(selectedUnitIds) || selectedUnitIds.length === 0) {
      return NextResponse.json({ error: "selectedUnitIds array is required" }, { status: 400 });
    }

    // Build the query to get randomly up to 10 questions the user hasn't seen for the given units
    const unitsPlaceholder = selectedUnitIds.map(() => '?').join(',');
    const queryArgs: any[] = [...selectedUnitIds];
    
    let seenFilter = '';
    if (seenIds.length > 0) {
        const seenPlaceholder = seenIds.map(() => '?').join(',');
        seenFilter = `AND id NOT IN (${seenPlaceholder})`;
        queryArgs.push(...seenIds);
    }
    
    // We want to fetch up to 10 random questions
    const limit = 10;
    
    const statement = sqliteDb.prepare(`
        SELECT * FROM ollama_quizzes 
        WHERE unitId IN (${unitsPlaceholder}) ${seenFilter} 
        ORDER BY RANDOM() 
        LIMIT ${limit}
    `);
    
    const rows = statement.all(...queryArgs) as any[];

    // Parse options string back to JSON
    const questions = rows.map(r => ({
        id: r.id,
        question: r.question,
        options: JSON.parse(r.options),
        answerIndex: r.answerIndex,
        explanation: r.explanation,
        meaning: r.meaning,
        unitId: r.unitId
    }));

    // Re-buffer logic
    // If the pool of unseen questions returned is less than our threshold (10), 
    // kick off the async background process to re-buffer the SQLite DB.
    if (questions.length < 10) {
        // Fire and forget, DO NOT await
        generateBackgroundQuizzes(selectedUnitIds).catch(err => {
            console.error("Background buffer failure:", err);
        });
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Quizzes fetch failed:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
