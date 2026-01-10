export type Language = "en" | "es" | "ja"

export type TranslationKey =
  | "chipLabel"
  | "heroTitle"
  | "heroSubtitle"
  | "modeLabel"
  | "tip"
  | "settings"
  | "closeSettings"
  | "reset"
  | "practiceSettings"
  | "wordLength"
  | "characters"
  | "charactersDescription"
  | "allHiragana"
  | "altHiragana"
  | "allKatakana"
  | "altKatakana"
  | "selectAll"
  | "deselectAll"
  | "selectedCount"
  | "noWordsTitle"
  | "noWordsBody"
  | "correctAnswer"
  | "meaning"
  | "kanji"
  | "showMeaning"
  | "placeholder"
  | "skip"
  | "check"
  | "nextWord"
  | "score"
  | "streak"
  | "best"
  | "accuracy"
  | "hiraganaLabel"
  | "katakanaLabel"
  | "bothLabel"
  | "selectGroupsHint" 
  | "wordsLabel"
  | "clear"
  | "numbersTitle"
  | "numbersSubtitle"
  | "startPractice"
  | "startNumbers"
  | "writeInJapanese"
  | "useKeypadBelow"
  | "yourAnswer"
  | "nextNumber"
  | "pressEnter"
  | "toSubmit"
  | "easy"
  | "medium"
  | "hard"
  | "expert"

export const translations: Record<Language, Record<TranslationKey, string>> = {
  en: {
    chipLabel: "Kana Practice",
    heroTitle: "Master Japanese Kana",
    heroSubtitle: "Drill romaji for hiragana and katakana words with streaks, filters, and quick mode switching.",
    modeLabel: "Mode",
    tip: "Tip: Press Enter to check or move to the next word. Use filters to target specific character groups.",
    settings: "Settings",
    closeSettings: "Close settings",
    reset: "Reset",
    practiceSettings: "Practice Settings",
    wordLength: "Word Length",
    characters: "Character Groups",
    charactersDescription: "Select which character rows to include. Leave empty for all.",
    allHiragana: "All Hiragana groups",
    altHiragana: "Alternative characters (が · ば · きゃ…)",
    allKatakana: "All Katakana groups",
    altKatakana: "Alternative characters (ガ · バ · キャ…)",
    selectAll: "Select all",
    deselectAll: "Deselect all",
    selectedCount: "selected",
    noWordsTitle: "No words match your current filters.",
    noWordsBody: "Try adjusting the character groups or word length settings.",
    correctAnswer: "Correct answer",
    meaning: "Meaning",
    kanji: "Kanji",
    showMeaning: "Show meaning ↗",
    placeholder: "Type romaji...",
    skip: "Skip",
    check: "Check",
    nextWord: "Next Word",
    score: "Score",
    streak: "Streak",
    best: "Best",
    accuracy: "Accuracy",
    hiraganaLabel: "Hiragana",
    katakanaLabel: "Katakana",
    bothLabel: "Both",
    selectGroupsHint: "Select at least one character group to start.",
    wordsLabel: "Words practice",
    startPractice: "Start practice",
    startNumbers: "Start numbers",
    numbersTitle: "Numbers Challenge",
    numbersSubtitle: "Write the number in Japanese",
    writeInJapanese: "Write in Japanese",
    useKeypadBelow: "Use the keypad below",
    yourAnswer: "Your answer",
    nextNumber: "Next Number",
    pressEnter: "Press",
    toSubmit: "to submit",
    clear: "Clear",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    expert: "Expert",
  },
  es: {
    chipLabel: "Práctica de Kana",
    heroTitle: "Domina los kana japoneses",
    heroSubtitle: "Practica el rōmaji para palabras en hiragana y katakana con rachas, filtros y cambio rápido de modo.",
    modeLabel: "Modo",
    tip: "Tip: Presiona Enter para comprobar o pasar a la siguiente palabra. Usa los filtros para elegir grupos específicos.",
    settings: "Ajustes",
    closeSettings: "Cerrar ajustes",
    reset: "Reiniciar",
    practiceSettings: "Ajustes de práctica",
    wordLength: "Longitud de palabra",
    characters: "Grupos de caracteres",
    charactersDescription: "Elige qué filas incluir. Déjalo vacío para incluir todas.",
    allHiragana: "Todos los grupos de Hiragana",
    altHiragana: "Caracteres alternativos (が · ば · きゃ…)",
    allKatakana: "Todos los grupos de Katakana",
    altKatakana: "Caracteres alternativos (ガ · バ · キャ…)",
    selectAll: "Seleccionar todo",
    deselectAll: "Deseleccionar todo",
    selectedCount: "seleccionados",
    noWordsTitle: "No hay palabras para estos filtros.",
    noWordsBody: "Prueba ajustando los grupos de caracteres o la longitud.",
    correctAnswer: "Respuesta correcta",
    meaning: "Significado",
    kanji: "Kanji",
    showMeaning: "Ver significado ↗",
    placeholder: "Escribe el rōmaji...",
    skip: "Saltar",
    check: "Comprobar",
    nextWord: "Siguiente palabra",
    score: "Puntaje",
    streak: "Racha",
    best: "Mejor",
    accuracy: "Precisión",
    hiraganaLabel: "Hiragana",
    katakanaLabel: "Katakana",
    bothLabel: "Ambos",
    selectGroupsHint: "Selecciona al menos un grupo de caracteres para comenzar.",
    wordsLabel: "Práctica de palabras",
    startPractice: "Comenzar práctica",
    startNumbers: "Empezar números",
    numbersTitle: "Desafío de Números",
    numbersSubtitle: "Escribe el número en japonés",
    writeInJapanese: "Escribe en japonés",
    useKeypadBelow: "Usa el teclado de abajo",
    yourAnswer: "Tu respuesta",
    nextNumber: "Siguiente Número",
    pressEnter: "Presiona",
    toSubmit: "para enviar",
    clear: "Borrar",
    easy: "Fácil",
    medium: "Intermedio",
    hard: "Difícil",
    expert: "Experto",
  },
  ja: {
    chipLabel: "かな練習",
    heroTitle: "日本語のかなをマスターしよう",
    heroSubtitle: "ひらがな・カタカナの単語でローマ字入力を練習。連続正解やフィルターで効率アップ。",
    modeLabel: "モード",
    tip: "ヒント: Enterキーで答えを確認または次の単語へ。フィルターで練習範囲を絞れます。",
    settings: "設定",
    closeSettings: "設定を閉じる",
    reset: "リセット",
    practiceSettings: "練習設定",
    wordLength: "文字数",
    characters: "文字グループ",
    charactersDescription: "含める行を選択します。空のままですべてを含みます。",
    allHiragana: "ひらがな全グループ",
    altHiragana: "拗音・濁音など (が · ば · きゃ…)",
    allKatakana: "カタカナ全グループ",
    altKatakana: "拗音・濁音など (ガ · バ · キャ…)",
    selectAll: "すべて選択",
    deselectAll: "すべて解除",
    selectedCount: "選択中",
    noWordsTitle: "現在のフィルターに合う単語がありません。",
    noWordsBody: "文字グループや文字数を調整してください。",
    correctAnswer: "正解",
    meaning: "意味",
    kanji: "漢字",
    showMeaning: "意味を見る ↗",
    placeholder: "ローマ字を入力...",
    skip: "スキップ",
    check: "チェック",
    nextWord: "次の単語",
    score: "スコア",
    streak: "連続",
    best: "最高",
    accuracy: "正答率",
    hiraganaLabel: "ひらがな",
    katakanaLabel: "カタカナ",
    bothLabel: "両方",
    selectGroupsHint: "開始するには文字グループを選択してください。",
    wordsLabel: "単語練習",
    startPractice: "練習を始める",
    startNumbers: "数字を始める",
    numbersTitle: "数字チャレンジ",
    numbersSubtitle: "数字を日本語で書いてください",
    writeInJapanese: "日本語で書く",
    useKeypadBelow: "下のキーパッドを使用",
    yourAnswer: "あなたの答え",
    nextNumber: "次の数字",
    pressEnter: "Enterキーを押して",
    toSubmit: "送信",
    clear: "クリア",
    easy: "かんたん",
    medium: "ふつう",
    hard: "むずかしい",
    expert: "エキスパート",
  },
}
