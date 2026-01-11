import fs from 'fs';
import path from 'path';
import readline from 'readline';

type KanjiEntry = {
  rank?: string;
  code_point_hex?: string;
  char: string;
  char_count?: string;
  id: number;
  meaning_en: string | null;
  meaning_es: string | null;
  reading?: string | null;
  jlpt: string | null;
};

type CliArgs = {
  input?: string;
  translations?: string;
  output?: string;
  jlpt?: string;
};

const readVersions = (dir: string): string[] => {
  const files = fs.readdirSync(dir);
  return files
    .filter((f) => /^kanjiset-v\d+\.json$/i.test(f))
    .sort((a, b) => {
      const va = parseInt(a.match(/v(\d+)/i)?.[1] ?? "0", 10);
      const vb = parseInt(b.match(/v(\d+)/i)?.[1] ?? "0", 10);
      return va - vb;
    });
};

const readTranslationCandidates = (dir: string): string[] => {
  const files = fs.readdirSync(dir);
  return files
    .filter((f) => f.endsWith(".json"))
    .filter((f) => f.includes("missing-es") || f.includes("translations"))
    .sort();
};

const promptSelect = async (message: string, options: string[], defaultIndex: number): Promise<string> => {
  if (options.length === 0) return "";
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q: string) => new Promise<string>((res) => rl.question(q, res));
  const safeDefault = Math.max(0, Math.min(defaultIndex, options.length - 1));
  const list = options.map((o, i) => `${i + 1}) ${o}${i === safeDefault ? " (default)" : ""}`).join("\n");
  const answer = await ask(`${message}\n${list}\nChoose [${safeDefault + 1}]: `);
  rl.close();
  const idx = parseInt(answer.trim(), 10);
  if (!Number.isNaN(idx) && idx >= 1 && idx <= options.length) {
    const selected = options[idx - 1];
    if (selected !== undefined) return selected;
  }
  const fallback: string = options[safeDefault] ?? options[0] ?? "";
  return fallback;
};

const ensureUniquePath = (target: string): string => {
  if (!fs.existsSync(target)) return target;
  const { dir, name, ext } = path.parse(target);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return path.join(dir, `${name}-copy-${stamp}${ext}`);
};

const parseArgs = (): CliArgs => {
  const args = process.argv.slice(2);
  const get = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    const val = idx >= 0 ? args[idx + 1] : undefined;
    return typeof val === "string" ? val : undefined;
  };
  const input = get("--input");
  const translations = get("--translations");
  const output = get("--output");
  const jlpt = get("--jlpt")?.toLowerCase();
  return { input, translations, output, jlpt };
};

const main = async () => {
  const args = parseArgs();

  const dataDir = path.join(process.cwd(), "data");
  const versions = readVersions(dataDir);
  const defaultDatasetIdx = versions.length > 0 ? versions.length - 1 : 0;
  const chosenDataset =
    args.input ??
    (versions.length > 0
      ? await promptSelect("Select kanjiset dataset to merge into:", versions, defaultDatasetIdx)
      : "kanjiset.json");
  const input = path.resolve(dataDir, chosenDataset);

  const translationCandidates = readTranslationCandidates(dataDir);
  const defaultTransIdx = translationCandidates.length > 0 ? translationCandidates.length - 1 : 0;
  const chosenTranslations =
    args.translations ??
    (translationCandidates.length > 0
      ? await promptSelect("Select translations file (meaning_es) to apply:", translationCandidates, defaultTransIdx)
      : "kanjiset-n1-missing-es.json");
  const translations = path.resolve(dataDir, chosenTranslations);

  const jlptLevels = ["jlpt-n5", "jlpt-n4", "jlpt-n3", "jlpt-n2", "jlpt-n1"];
  const defaultJlptIdx = jlptLevels.indexOf("jlpt-n1");
  const jlptChoice =
    args.jlpt && jlptLevels.includes(args.jlpt)
      ? args.jlpt
      : await promptSelect(
          "Select JLPT level to merge (will only apply translations for this level):",
          jlptLevels,
          defaultJlptIdx >= 0 ? defaultJlptIdx : jlptLevels.length - 1
        );

  const defaultOutput = path.resolve(dataDir, `${path.parse(input).name}-merged.json`);
  const output = ensureUniquePath(path.resolve(args.output ?? defaultOutput));

  const kanjisetRaw = fs.readFileSync(input, 'utf8');
  const kanjisetData: KanjiEntry[] = JSON.parse(kanjisetRaw);

  const translationsRaw = fs.readFileSync(translations, 'utf8');
  const translationsData: KanjiEntry[] = JSON.parse(translationsRaw);

  const transMap = new Map<number, KanjiEntry>();
  translationsData.forEach(entry => {
    if (entry.id !== undefined && entry.jlpt?.toLowerCase() === jlptChoice) {
      transMap.set(entry.id, entry);
    }
  });

  console.log(`Loaded ${kanjisetData.length} entries from ${input}`);
  console.log(`Loaded ${translationsData.length} translated entries`);
  console.log(`Found ${transMap.size} unique entries with IDs`);

  let mergedCount = 0;
  const mergedData = kanjisetData.map(entry => {
    if (entry.id !== undefined && entry.jlpt?.toLowerCase() === jlptChoice && transMap.has(entry.id)) {
      const t = transMap.get(entry.id)!;
      mergedCount++;
      return {
        ...entry,
        meaning_es: t.meaning_es
      };
    }
    return entry;
  });

  fs.writeFileSync(output, JSON.stringify(mergedData, null, 2));

  console.log(`Merged ${mergedCount} entries with Spanish translations for ${jlptChoice.toUpperCase()}`);
  console.log(`Output written to ${output}`);

  const totalEntries = mergedData.length;
  const entriesWithSpanish = mergedData.filter(e => e.meaning_es && e.meaning_es.trim() !== '').length;
  const n1Entries = mergedData.filter(e => e.jlpt?.toLowerCase() === 'jlpt-n1').length;
  const n1WithSpanish = mergedData.filter(e => e.jlpt?.toLowerCase() === 'jlpt-n1' && e.meaning_es && e.meaning_es.trim() !== '').length;

  console.log('\n=== Dataset Statistics ===');
  console.log(`Total entries: ${totalEntries}`);
  console.log(`Entries with Spanish: ${entriesWithSpanish} (${((entriesWithSpanish / totalEntries) * 100).toFixed(1)}%)`);
  console.log(`N1 entries: ${n1Entries}`);
  console.log(`N1 entries with Spanish: ${n1WithSpanish} (${((n1WithSpanish / Math.max(n1Entries, 1)) * 100).toFixed(1)}%)`);
};

main().catch(console.error);
