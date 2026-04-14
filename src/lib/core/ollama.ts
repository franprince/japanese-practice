import { curriculum } from "../japanese/curriculum";

export interface QuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  meaning: string;
  unitId: number;
}

export interface QuizGenerationResponse {
  questions: QuizQuestion[];
}

export class OllamaService {
  private baseUrl: string;
  private model: string;

  constructor() {
    // Default to localhost if not configured
    this.baseUrl = process.env.OLLAMA_API_URL || "http://localhost:11434/api/generate";
    this.model = process.env.OLLAMA_MODEL || "qwen3.5:cloud";
  }

  private buildSystemPrompt(selectedUnitIds: number[], batchSize: number): string {
    const selectedUnits = curriculum.filter(u => selectedUnitIds.includes(u.id));

    if (selectedUnits.length === 0) {
      throw new Error("No units selected.");
    }

    let prompt = `You are a Japanese language teacher creating a multiple-choice quiz for students.
You must generate exactly ${batchSize} multiple-choice question(s).

CRITICAL INSTRUCTIONS:
1. STRICT SCOPING: You are ONLY allowed to use the vocabulary, grammar, and sentence structures found in the provided selected units below. DO NOT introduce unknown kanji or grammar from higher levels.
2. TARGETED BLANKS: Do not put blanks on generic sentence endings (like "です" or "ます") unless that is the primary focus of the unit. Instead, target the "core challenges" for each unit:
   - Unit 1: Particles (は, も), Negative forms (じゃ ありません), Occupations.
   - Unit 2: Demonstratives (これ, それ, あれ), Possession (の).
   - Unit 3: Directions (ここ, どこ, あそこ), Numbers/Prices, Places.
   - Unit 4: Time/Days (時, 分), Verb conjugations (ます, ました, ません).
3. VERB CONJUGATION RULE: When testing verb endings (Unit 4), the blank MUST replace the suffix (ます, ません, ました, ませんでした). The stem of the verb (the part before -masu) MUST remain before the blank. NEVER place a blank after a complete verb ending. 
   - Correct: 起き___ (Expected: ます or ません)
   - Incorrect: 起きます ___
4. MULTIPLE BLANKS: You can use between ONE and THREE blanks ('___') per question if the context (like a particle and a verb ending) warrants it.
4. OPTION FORMAT FOR MULTIPLE BLANKS: If a question has N blanks, each option MUST be a string with N values separated by a standard half-width comma and a space (e.g., "は, です" or "これ, の"). DO NOT use Japanese full-width commas (，). If there is only one blank, provide a single value as usual.
5. JSON INTEGRITY: Ensure every string is properly closed with a double quote and the JSON is valid.
5. NO AMBIGUITY: Every question MUST be solvable without looking at the "meaning" or "explanation" fields. If multiple options are grammatically correct in a generic sentence (e.g. "whose" vs "what kind"), you MUST use a dialogue (A & B) where the response (B) provides the necessary context to resolve the ambiguity.
6. SPECIFIC CONTEXTUAL HINTS: For standalone fill-in-the-blank sentences, YOU MUST add a trailing English hint in parentheses. DO NOT use generic hints like "(Question)" or "(Blank)". Instead, specify the intent or form required, e.g., "(Whose?)", "(What kind?)", "(Negative form)", "(Polite)", "(Location?)", or "(Age?)".
7. DIALOGUE PREFERENCE: Heavily prioritize short 2-line dialogues (A & B) for questions about possession, time, or location, as they provide natural context. Use a newline (\n) between speakers.
8. ALWAYS USE KANJI WITH FURIGANA: Whenever a word has a standard Kanji representation, you MUST use the Kanji followed immediately by its reading in brackets: 漢字[かんじ]. This applies to EVERY occurrence of the word, even if it appears multiple times in the same dialogue.
9. FURIGANA FORMAT: Append the reading inside brackets immediately after the Kanji: 漢字[かんじ]. DO NOT use spaces before the bracket.
10. MEANING: You must provide the English meaning (translation) of the full Japanese sentence/dialogue in the "meaning" field.
11. FORMAT: Output MUST be strictly in JSON without wrapping it in markdown. Do not return markdown code blocks, just raw JSON.
12. OUTPUT SCHEMA:
{
  "questions": [
    {
      "question": "The Japanese sentence or dialogue. Use brackets for readings. Include contextual hints if standalone.",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "answerIndex": 0,
      "explanation": "Short English explanation of the grammar rule used.",
      "meaning": "English translation of the full sentence or dialogue.",
      "unitId": 1
    }
  ]
}

SELECTED UNITS FOR THIS QUIZ:
`;

    for (const unit of selectedUnits) {
      prompt += `\n--- Unit ${unit.id}: ${unit.title} ---
Summary: ${unit.summary}
Example Sentences:
${unit.exampleSentences.map(s => "- " + s).join("\n")}
`;
    }

    prompt += `\nNow, generate ${batchSize} multiple-choice questions matching the style and grammar of these units. Output valid JSON only.`;

    return prompt;
  }

  public async generateQuiz(selectedUnitIds: number[], batchSize: number = 5, retryCount = 0): Promise<QuizGenerationResponse> {
    const maxRetries = 2;
    const prompt = this.buildSystemPrompt(selectedUnitIds, batchSize);

    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.3, // Low temperature for consistency
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();

      let rawJson = data.response;
      // Strip markdown code blocks if the model wrapped the JSON
      if (rawJson.includes("```json")) {
        rawJson = rawJson.split("```json")[1].split("```")[0].trim();
      } else if (rawJson.includes("```")) {
        rawJson = rawJson.split("```")[1].split("```")[0].trim();
      } else {
        rawJson = rawJson.trim();
      }
      // If there are <think> blocks at the start due to reasoning models, remove them
      if (rawJson.includes("</think>")) {
        rawJson = rawJson.split("</think>")[1].trim();
      }

      // Handle invalid escape characters generated by LLMs (e.g. \', \_)
      // Standard JSON only allows \", \\, \/, \b, \f, \n, \r, \t
      rawJson = rawJson.replace(/\\'/g, "'").replace(/\\_/g, "_");

      let parsedQuiz: QuizGenerationResponse;
      try {
        parsedQuiz = JSON.parse(rawJson) as QuizGenerationResponse;
      } catch (parseError) {
        console.error("Failed to parse JSON. Raw output was:", rawJson);
        throw parseError; // Rethrow to trigger the retry logic
      }

      // Basic validation
      if (!parsedQuiz.questions || !Array.isArray(parsedQuiz.questions) || parsedQuiz.questions.length === 0) {
        throw new Error("Invalid output format: Missing 'questions' array.");
      }

      for (const q of parsedQuiz.questions) {
        if (!q.question || !q.options || q.answerIndex === undefined || !q.explanation || !q.meaning || q.unitId === undefined) {
          throw new Error("Invalid output format: Malformed question object (missing required fields).");
        }
      }

      return parsedQuiz;

    } catch (error) {
      console.error(`Attempt ${retryCount + 1} failed:`, error);
      if (retryCount < maxRetries) {
        return this.generateQuiz(selectedUnitIds, batchSize, retryCount + 1);
      }
      throw new Error(`Failed to generate quiz after ${maxRetries + 1} attempts`);
    }
  }
}

export const ollamaService = new OllamaService();
