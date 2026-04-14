import { NextResponse } from "next/server";
import { ollamaService } from "@/lib/core/ollama";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { selectedUnits, batchSize } = body;

    if (!selectedUnits || !Array.isArray(selectedUnits) || selectedUnits.length === 0) {
      return NextResponse.json(
        { error: "selectedUnits array is required and must not be empty" },
        { status: 400 }
      );
    }

    // Default to 5 if batchSize is not provided or invalid
    const size = typeof batchSize === "number" && batchSize > 0 ? batchSize : 5;

    const quizResponse = await ollamaService.generateQuiz(selectedUnits, size);

    return NextResponse.json(quizResponse);
  } catch (error) {
    console.error("Quiz generation failed:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
