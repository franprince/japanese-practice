import { kanaToRomaji } from '../src/lib/japanese/words/words';
import { validateAnswer, toMacronForm } from '../src/lib/japanese/shared/input';
import { detectErrors } from '../src/lib/japanese/shared/error-detection';
import type { JapaneseWord } from '../src/types/japanese';
import { loadKanaDictionary, getKanaRomajiMap } from '../src/lib/japanese/shared/kana-dictionary-loader';

async function runTests() {
    console.log("Loading dictionary...");
    await loadKanaDictionary();
    await getKanaRomajiMap(); // Computes the map
    console.log("Dictionary loaded.");

    const conversionTests = [
        { input: "ブー", expected: "bū" },
        { input: "コーヒー", expected: "kōhī" },
        { input: "パーティー", expected: "pātī" },
        { input: "すうじ", expected: "sūji" },
        { input: "おとうさん", expected: "otōsan" },
        { input: "ありがとう", expected: "arigatō" },
        { input: "おおきい", expected: "ōkī" },
        { input: "せんせい", expected: "sensei" }, // ei remains ei
        { input: "ガター", expected: "gatā" },
    ];

    console.log("\n--- Conversion Tests (kanaToRomaji) ---");
    let passCount = 0;
    for (const t of conversionTests) {
        const result = kanaToRomaji(t.input);
        if (result === t.expected) {
            console.log(`PASS: ${t.input} -> ${result}`);
            passCount++;
        } else {
            console.error(`FAIL: ${t.input} -> Expected '${t.expected}', got '${result}'`);
        }
    }

    console.log("\n--- Validation Tests (validateAnswer) ---");

    const validationTests = [
        { input: "buu", answerRomaji: "bū", shouldPass: true },
        { input: "bū", answerRomaji: "bū", shouldPass: true },
        { input: "suuji", answerRomaji: "sūji", shouldPass: true },
        { input: "sūji", answerRomaji: "sūji", shouldPass: true },
        { input: "arigatou", answerRomaji: "arigatō", shouldPass: true },
        { input: "arigatoo", answerRomaji: "arigatō", shouldPass: true },
        { input: "arigatō", answerRomaji: "arigatō", shouldPass: true },
        { input: "bu", answerRomaji: "bū", shouldPass: false },
        { input: "kōhī", answerRomaji: "kōhī", shouldPass: true },
        { input: "koohii", answerRomaji: "kōhī", shouldPass: true },
        { input: "gataa", answerRomaji: "gatā", shouldPass: true }, // The user case
    ];

    for (const t of validationTests) {
        const mockWord: JapaneseWord = {
            kana: "dummy",
            romaji: t.answerRomaji,
            type: "katakana",
            groups: [],
        };
        const result = validateAnswer(t.input, mockWord);
        if (result === t.shouldPass) {
            console.log(`PASS: Input '${t.input}' vs Answer '${t.answerRomaji}' -> ${result}`);
            passCount++;
        } else {
            console.error(`FAIL: Input '${t.input}' vs Answer '${t.answerRomaji}' -> Expected ${t.shouldPass}, got ${result}`);
        }
    }

    console.log("\n--- Granular Error Detection Tests (detectErrors) ---");
    // Test case from screenshot: ガター (gatā) vs "gataa"
    const granularTests = [
        { kana: "ガター", input: "gataa", expectedComplete: true },
        { kana: "ガター", input: "gatā", expectedComplete: true },
        { kana: "パーティー", input: "paatii", expectedComplete: true },
        { kana: "パーティー", input: "pātī", expectedComplete: true },
        { kana: "ガター", input: "ta", expectedComplete: false },
    ];

    for (const t of granularTests) {
        const result = await detectErrors(t.kana, t.input);
        if (result.isFullyCorrect === t.expectedComplete) {
            console.log(`PASS: ${t.kana} vs ${t.input} -> Correctness: ${result.isFullyCorrect}`);
            // Check segments if correct
            if (t.expectedComplete) {
                const allSegmentsCorrect = result.characters.every(c => c.isCorrect);
                if (!allSegmentsCorrect) {
                    console.error(`  FAIL: Reported fully correct but segments have errors!`);
                }
            }
        } else {
            console.error(`FAIL: ${t.kana} vs ${t.input} -> Expected Correct: ${t.expectedComplete}, Got: ${result.isFullyCorrect}`);
            result.characters.forEach(c => {
                console.log(`   Token: ${c.kana} (${c.expectedRomaji.join(',')}) vs Input: ${c.userInput} -> ${c.isCorrect ? 'OK' : 'FAIL'}`);
            });
        }
    }
}

runTests().catch(e => console.error(e));
