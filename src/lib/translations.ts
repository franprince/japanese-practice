export type Language = "en" | "es" | "ja"

export type TranslationKey =
  | "chipLabel"
  | "heroTitle"
  | "heroSubtitle"
  | "heroTagline"
  | "games.romaji.title"
  | "games.romaji.description"
  | "games.numbers.title"
  | "games.numbers.description"
  | "games.kanji.title"
  | "games.kanji.description"
  | "games.dates.title"
  | "games.dates.description"
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
  | "reading"
  | "word"
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
  | "numbersModeArabicToKanji"
  | "numbersModeKanjiToArabic"
  | "startPractice"
  | "startNumbers"
  | "writeInJapanese"
  | "writeInArabic"
  | "useKeypadBelow"
  | "yourAnswer"
  | "nextNumber"
  | "shuffleNumbers"
  | "pressEnter"
  | "toSubmit"
  | "easy"
  | "medium"
  | "hard"
  | "expert"
  | "kanjiTitle"
  | "kanjiSubtitle"
  | "whatIsReading"
  | "correct"
  | "incorrect"
  | "nextKanji"
  | "selectDifficulty"
  | "kanjiEasyHint"
  | "kanjiMediumHint"
  | "kanjiHardHint"
  | "datesTitle"
  | "datesSubtitle"
  | "monthsOnly"
  | "fullDates"
  | "dayOfMonth"
  | "month"
  | "date"
  | "writeFullDate"
  | "writeMonthReading"
  | "typeHiraganaOrRomaji"
  | "nextDate"
  | "pillar.learning.title"
  | "pillar.learning.body"
  | "pillar.mindfulness.title"
  | "pillar.mindfulness.body"
  | "pillar.path.title"
  | "pillar.path.body"
  | "playModeInfinite"
  | "playModeSession"
  | "questionsLabel"
  | "questionsLeft"
  | "sessionCompleteTitle"
  | "sessionTargetLabel"
  | "sessionCorrectLabel"
  | "sessionAccuracyLabel"
  | "sessionRestart"
  | "sessionSwitchToInfinite"
  | "custom"
  | "apply"
  | "roundsLeft"
  | "weekDays"
  | "writeWeekDay"
  | "showName"
  | "showNumber"
  | "day.sunday"
  | "day.monday"
  | "day.tuesday"
  | "day.wednesday"
  | "day.thursday"
  | "day.friday"
  | "day.saturday"
  | "month.january"
  | "month.february"
  | "month.march"
  | "month.april"
  | "month.may"
  | "month.june"
  | "month.july"
  | "month.august"
  | "month.september"
  | "month.october"
  | "month.november"
  | "month.december"


export const translations: Record<Language, Record<TranslationKey, string>> = {
  en: {
    chipLabel: "Kana Practice",
    heroTitle: "Master Japanese Kana",
    heroSubtitle: "Drill romaji for hiragana and katakana words with streaks, filters, and quick mode switching.",
    heroTagline: "Master the art of Japanese through carefully crafted games. Each challenge brings you closer to fluency.",
    "games.romaji.title": "Romaji Practice",
    "games.romaji.description": "Drill romaji for hiragana and katakana words with streaks, filters, and quick mode switching.",
    "games.numbers.title": "Numbers Challenge",
    "games.numbers.description": "Write the number in Japanese with flexible difficulty and keypad input.",
    "games.kanji.title": "Kanji Challenge",
    "games.kanji.description": "Match kanji with their readings and meanings across multiple difficulty levels.",
    "games.dates.title": "Dates Challenge",
    "games.dates.description": "Write day and month readings or full dates in Japanese.",
    "pillar.learning.title": "Learning",
    "pillar.learning.body": "Progressive difficulty levels designed to build mastery steadily",
    "pillar.mindfulness.title": "Mindfulness",
    "pillar.mindfulness.body": "Focused practice with clear feedback and meaningful progress tracking",
    "pillar.path.title": "Path",
    "pillar.path.body": "Your journey to Japanese fluency starts with a single character",
    playModeInfinite: "Infinite",
    playModeSession: "Session",
    questionsLabel: "Questions",
    questionsLeft: "{count} left",
    sessionCompleteTitle: "Session complete",
    sessionTargetLabel: "Target",
    sessionCorrectLabel: "Correct",
    sessionAccuracyLabel: "Accuracy",
    sessionRestart: "Restart session",
    sessionSwitchToInfinite: "Switch to Infinite",
    custom: "Custom",
    apply: "Apply",
    roundsLeft: "{count} rounds left",
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
    reading: "Reading",
    word: "Word",
    kanji: "Kanji",
    showMeaning: "Show meaning in jisho.org ↗",
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
    startPractice: "Start Practice",
    startNumbers: "Start Numbers",
    numbersTitle: "Numbers Challenge",
    numbersSubtitle: "Write the number in Japanese with flexible difficulty and keypad input.",
    writeInJapanese: "Write in Japanese",
    numbersModeArabicToKanji: "123 → 漢",
    numbersModeKanjiToArabic: "漢 → 123",
    writeInArabic: "Write in Arabic",
    useKeypadBelow: "Use the keypad below",
    yourAnswer: "Your answer",
    nextNumber: "Next Number",
    shuffleNumbers: "Shuffle keys",
    pressEnter: "Press",
    toSubmit: "to submit",
    clear: "Clear",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    expert: "Expert",
    kanjiTitle: "Kanji Challenge",
    kanjiSubtitle: "Match the kanji with its reading",
    whatIsReading: "What is the reading?",
    correct: "Correct!",
    incorrect: "Incorrect",
    nextKanji: "Next Kanji",
    selectDifficulty: "Select Difficulty",
    kanjiEasyHint: "Reading + Romaji + Meaning",
    kanjiMediumHint: "Reading + Meaning",
    kanjiHardHint: "Reading only",
    datesTitle: "Dates Challenge",
    datesSubtitle: "Write dates in Japanese",

    monthsOnly: "Months",
    fullDates: "Full Dates",
    dayOfMonth: "Day of month",
    month: "Month",
    date: "Full date",
    writeFullDate: "Write the full date reading",
    writeMonthReading: "Write the month reading in hiragana",
    typeHiraganaOrRomaji: "Type hiragana or romaji...",
    nextDate: "Next Date",
    weekDays: "Days",
    writeWeekDay: "Write the day reading",
    showName: "Show Name",
    showNumber: "Show Number",
    "day.sunday": "Sunday",
    "day.monday": "Monday",
    "day.tuesday": "Tuesday",
    "day.wednesday": "Wednesday",
    "day.thursday": "Thursday",
    "day.friday": "Friday",
    "day.saturday": "Saturday",
    "month.january": "January",
    "month.february": "February",
    "month.march": "March",
    "month.april": "April",
    "month.may": "May",
    "month.june": "June",
    "month.july": "July",
    "month.august": "August",
    "month.september": "September",
    "month.october": "October",
    "month.november": "November",
    "month.december": "December",
  },
  es: {
    chipLabel: "Práctica de Kana",
    heroTitle: "Domina los kana japoneses",
    heroSubtitle: "Practica el rōmaji para palabras en hiragana y katakana con rachas, filtros y cambio rápido de modo.",
    heroTagline: "Domina el arte del japonés con juegos cuidadosamente diseñados. Cada desafío te acerca más a la fluidez.",
    "games.romaji.title": "Práctica de Rōmaji",
    "games.romaji.description": "Practica el rōmaji para palabras en hiragana y katakana con rachas, filtros y cambio rápido de modo.",
    "games.numbers.title": "Desafío de Números",
    "games.numbers.description": "Escribe el número en japonés con dificultad flexible y teclado en pantalla.",
    "games.kanji.title": "Desafío Kanji",
    "games.kanji.description": "Relaciona el kanji con su lectura y significado en varios niveles de dificultad.",
    "games.dates.title": "Desafío de Fechas",
    "games.dates.description": "Escribe las lecturas de días, meses o fechas completas en japonés.",
    "pillar.learning.title": "Aprendizaje",
    "pillar.learning.body": "Niveles de dificultad progresivos pensados para construir dominio paso a paso",
    "pillar.mindfulness.title": "Atención plena",
    "pillar.mindfulness.body": "Práctica enfocada con retroalimentación clara y seguimiento significativo del progreso",
    "pillar.path.title": "Camino",
    "pillar.path.body": "Tu camino hacia la fluidez del japonés empieza con un solo carácter",
    playModeInfinite: "Infinito",
    playModeSession: "Sesión",
    questionsLabel: "Preguntas",
    questionsLeft: "Quedan {count}",
    sessionCompleteTitle: "Sesión completa",
    sessionTargetLabel: "Objetivo",
    sessionCorrectLabel: "Correctas",
    sessionAccuracyLabel: "Precisión",
    sessionRestart: "Reiniciar sesión",
    sessionSwitchToInfinite: "Cambiar a Infinito",
    custom: "Personalizado",
    apply: "Aplicar",
    roundsLeft: "Quedan {count} rondas",
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
    reading: "Lectura",
    word: "Palabra",
    kanji: "Kanji",
    showMeaning: "Ver significado en jisho.org ↗",
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
    numbersModeArabicToKanji: "123 → 漢",
    numbersModeKanjiToArabic: "漢 → 123",
    writeInJapanese: "Escribe en japonés",
    writeInArabic: "Escribe en arábigos",
    useKeypadBelow: "Usa el teclado de abajo",
    yourAnswer: "Tu respuesta",
    nextNumber: "Siguiente Número",
    shuffleNumbers: "Mezclar teclas",
    pressEnter: "Presiona",
    toSubmit: "para enviar",
    clear: "Borrar",
    easy: "Fácil",
    medium: "Intermedio",
    hard: "Difícil",
    expert: "Experto",
    kanjiTitle: "Desafío Kanji",
    kanjiSubtitle: "Relaciona el kanji con su lectura",
    whatIsReading: "¿Cuál es la lectura?",
    correct: "¡Correcto!",
    incorrect: "Incorrecto",
    nextKanji: "Siguiente Kanji",
    selectDifficulty: "Seleccionar Dificultad",
    kanjiEasyHint: "Lectura + Romaji + Significado",
    kanjiMediumHint: "Lectura + Significado",
    kanjiHardHint: "Solo lectura",
    datesTitle: "Desafío de Fechas",
    datesSubtitle: "Escribe fechas en japonés",

    monthsOnly: "Meses",
    fullDates: "Fechas",
    dayOfMonth: "Día del mes",
    month: "Mes",
    date: "Fecha completa",
    writeFullDate: "Escribe la lectura completa de la fecha",
    writeMonthReading: "Escribe la lectura del mes en hiragana",
    typeHiraganaOrRomaji: "Escribe hiragana o romaji...",
    nextDate: "Siguiente Fecha",
    weekDays: "Días",
    writeWeekDay: "Escribe la lectura del día",
    showName: "Mostrar Nombre",
    showNumber: "Mostrar Número",
    "day.sunday": "Domingo",
    "day.monday": "Lunes",
    "day.tuesday": "Martes",
    "day.wednesday": "Miércoles",
    "day.thursday": "Jueves",
    "day.friday": "Viernes",
    "day.saturday": "Sábado",
    "month.january": "Enero",
    "month.february": "Febrero",
    "month.march": "Marzo",
    "month.april": "Abril",
    "month.may": "Mayo",
    "month.june": "Junio",
    "month.july": "Julio",
    "month.august": "Agosto",
    "month.september": "Septiembre",
    "month.october": "Octubre",
    "month.november": "Noviembre",
    "month.december": "Diciembre",
  },
  ja: {
    chipLabel: "かな練習",
    heroTitle: "日本語のかなをマスターしよう",
    heroSubtitle: "ひらがな・カタカナの単語でローマ字入力を練習。連続正解やフィルターで効率アップ。",
    heroTagline: "練り上げられたゲームで日本語を極めよう。挑戦するたびに流暢さへと近づきます。",
    "games.romaji.title": "ローマ字練習",
    "games.romaji.description": "ひらがな・カタカナ単語のローマ字入力を、連続正解やフィルターで効率的に練習できます。",
    "games.numbers.title": "数字チャレンジ",
    "games.numbers.description": "難易度を切り替えて、日本語で数字を書きます。キーパッド入力にも対応。",
    "games.kanji.title": "漢字チャレンジ",
    "games.kanji.description": "漢字と読み・意味を組み合わせて、難易度別にチャレンジ。",
    "games.dates.title": "日付チャレンジ",
    "games.dates.description": "日や月、日付全体の読み方を日本語で書きます。",
    "pillar.learning.title": "学び",
    "pillar.learning.body": "段階的な難易度で着実に実力を積み重ねていきます",
    "pillar.mindfulness.title": "心",
    "pillar.mindfulness.body": "明確なフィードバックと的確な進捗管理で集中して練習できます",
    "pillar.path.title": "道",
    "pillar.path.body": "日本語流暢への旅は一文字から始まります",
    playModeInfinite: "無制限",
    playModeSession: "セッション",
    questionsLabel: "問題数",
    questionsLeft: "残り {count}",
    sessionCompleteTitle: "セッション完了",
    sessionTargetLabel: "目標",
    sessionCorrectLabel: "正解",
    sessionAccuracyLabel: "正答率",
    sessionRestart: "セッションをリスタート",
    sessionSwitchToInfinite: "インフィニットに切り替え",
    custom: "カスタム",
    apply: "適用",
    roundsLeft: "残り {count} ラウンド",
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
    reading: "読み",
    word: "単語",
    kanji: "漢字",
    showMeaning: "意味を見る (jisho.org) ↗",
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
    numbersModeArabicToKanji: "123 → 漢",
    numbersModeKanjiToArabic: "漢 → 123",
    writeInJapanese: "日本語で書く",
    writeInArabic: "アラビア数字で書く",
    useKeypadBelow: "下のキーパッドを使用",
    yourAnswer: "あなたの答え",
    nextNumber: "次の数字",
    shuffleNumbers: "キーをシャッフル",
    pressEnter: "Enterキーを押して",
    toSubmit: "送信",
    clear: "クリア",
    easy: "かんたん",
    medium: "ふつう",
    hard: "むずかしい",
    expert: "エキスパート",
    kanjiTitle: "漢字チャレンジ",
    kanjiSubtitle: "漢字の読み方を当てよう",
    whatIsReading: "読み方は？",
    correct: "正解！",
    incorrect: "不正解",
    nextKanji: "次の漢字",
    selectDifficulty: "難易度を選択",
    kanjiEasyHint: "読み + ローマ字 + 意味",
    kanjiMediumHint: "読み + 意味",
    kanjiHardHint: "読みのみ",
    datesTitle: "日付チャレンジ",
    datesSubtitle: "日付を日本語で書いてください",
    monthsOnly: "月",
    fullDates: "日付",
    dayOfMonth: "日",
    month: "月",
    date: "日付",
    writeFullDate: "日付の読み方を書いてください",
    writeMonthReading: "月の読み方をひらがなで書いてください",
    typeHiraganaOrRomaji: "ひらがなかローマ字を入力...",
    nextDate: "次の日付",
    weekDays: "曜日",
    writeWeekDay: "曜日の読み方を書いてください",
    showName: "名前を表示",
    showNumber: "数字を表示",
    "day.sunday": "日曜日",
    "day.monday": "月曜日",
    "day.tuesday": "火曜日",
    "day.wednesday": "水曜日",
    "day.thursday": "木曜日",
    "day.friday": "金曜日",
    "day.saturday": "土曜日",
    "month.january": "1月",
    "month.february": "2月",
    "month.march": "3月",
    "month.april": "4月",
    "month.may": "5月",
    "month.june": "6月",
    "month.july": "7月",
    "month.august": "8月",
    "month.september": "9月",
    "month.october": "10月",
    "month.november": "11月",
    "month.december": "12月",
  },
}
