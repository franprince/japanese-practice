export type KanjiDifficulty = "easy" | "medium" | "hard"

export interface Kanji {
  kanji: string
  reading: string // hiragana reading
  romaji: string
  meaning: {
    en: string
    ja: string
    es: string
  }
  jlpt: number // JLPT level for grouping
}

export const kanjiList: Kanji[] = [
  // JLPT N5 - Basic
  { kanji: "日", reading: "ひ", romaji: "hi", meaning: { en: "day, sun", ja: "日、太陽", es: "día, sol" }, jlpt: 5 },
  { kanji: "月", reading: "つき", romaji: "tsuki", meaning: { en: "moon, month", ja: "月", es: "luna, mes" }, jlpt: 5 },
  { kanji: "火", reading: "ひ", romaji: "hi", meaning: { en: "fire", ja: "火", es: "fuego" }, jlpt: 5 },
  { kanji: "水", reading: "みず", romaji: "mizu", meaning: { en: "water", ja: "水", es: "agua" }, jlpt: 5 },
  { kanji: "木", reading: "き", romaji: "ki", meaning: { en: "tree, wood", ja: "木", es: "árbol, madera" }, jlpt: 5 },
  {
    kanji: "金",
    reading: "かね",
    romaji: "kane",
    meaning: { en: "gold, money", ja: "金、お金", es: "oro, dinero" },
    jlpt: 5,
  },
  { kanji: "土", reading: "つち", romaji: "tsuchi", meaning: { en: "earth, soil", ja: "土", es: "tierra" }, jlpt: 5 },
  { kanji: "人", reading: "ひと", romaji: "hito", meaning: { en: "person", ja: "人", es: "persona" }, jlpt: 5 },
  { kanji: "山", reading: "やま", romaji: "yama", meaning: { en: "mountain", ja: "山", es: "montaña" }, jlpt: 5 },
  { kanji: "川", reading: "かわ", romaji: "kawa", meaning: { en: "river", ja: "川", es: "río" }, jlpt: 5 },
  {
    kanji: "田",
    reading: "た",
    romaji: "ta",
    meaning: { en: "rice field", ja: "田んぼ", es: "campo de arroz" },
    jlpt: 5,
  },
  { kanji: "大", reading: "おお", romaji: "oo", meaning: { en: "big, large", ja: "大きい", es: "grande" }, jlpt: 5 },
  { kanji: "小", reading: "ちい", romaji: "chii", meaning: { en: "small", ja: "小さい", es: "pequeño" }, jlpt: 5 },
  {
    kanji: "中",
    reading: "なか",
    romaji: "naka",
    meaning: { en: "middle, inside", ja: "中", es: "medio, dentro" },
    jlpt: 5,
  },
  { kanji: "上", reading: "うえ", romaji: "ue", meaning: { en: "up, above", ja: "上", es: "arriba" }, jlpt: 5 },
  { kanji: "下", reading: "した", romaji: "shita", meaning: { en: "down, below", ja: "下", es: "abajo" }, jlpt: 5 },
  { kanji: "左", reading: "ひだり", romaji: "hidari", meaning: { en: "left", ja: "左", es: "izquierda" }, jlpt: 5 },
  { kanji: "右", reading: "みぎ", romaji: "migi", meaning: { en: "right", ja: "右", es: "derecha" }, jlpt: 5 },
  { kanji: "一", reading: "いち", romaji: "ichi", meaning: { en: "one", ja: "一つ", es: "uno" }, jlpt: 5 },
  { kanji: "二", reading: "に", romaji: "ni", meaning: { en: "two", ja: "二つ", es: "dos" }, jlpt: 5 },
  { kanji: "三", reading: "さん", romaji: "san", meaning: { en: "three", ja: "三つ", es: "tres" }, jlpt: 5 },
  { kanji: "四", reading: "よん", romaji: "yon", meaning: { en: "four", ja: "四つ", es: "cuatro" }, jlpt: 5 },
  { kanji: "五", reading: "ご", romaji: "go", meaning: { en: "five", ja: "五つ", es: "cinco" }, jlpt: 5 },
  { kanji: "六", reading: "ろく", romaji: "roku", meaning: { en: "six", ja: "六つ", es: "seis" }, jlpt: 5 },
  { kanji: "七", reading: "なな", romaji: "nana", meaning: { en: "seven", ja: "七つ", es: "siete" }, jlpt: 5 },
  { kanji: "八", reading: "はち", romaji: "hachi", meaning: { en: "eight", ja: "八つ", es: "ocho" }, jlpt: 5 },
  { kanji: "九", reading: "きゅう", romaji: "kyuu", meaning: { en: "nine", ja: "九つ", es: "nueve" }, jlpt: 5 },
  { kanji: "十", reading: "じゅう", romaji: "juu", meaning: { en: "ten", ja: "十", es: "diez" }, jlpt: 5 },
  { kanji: "百", reading: "ひゃく", romaji: "hyaku", meaning: { en: "hundred", ja: "百", es: "cien" }, jlpt: 5 },
  { kanji: "千", reading: "せん", romaji: "sen", meaning: { en: "thousand", ja: "千", es: "mil" }, jlpt: 5 },
  { kanji: "万", reading: "まん", romaji: "man", meaning: { en: "ten thousand", ja: "万", es: "diez mil" }, jlpt: 5 },
  { kanji: "円", reading: "えん", romaji: "en", meaning: { en: "yen, circle", ja: "円", es: "yen, círculo" }, jlpt: 5 },
  { kanji: "年", reading: "とし", romaji: "toshi", meaning: { en: "year", ja: "年", es: "año" }, jlpt: 5 },
  {
    kanji: "学",
    reading: "がく",
    romaji: "gaku",
    meaning: { en: "study, learning", ja: "学ぶ", es: "estudiar" },
    jlpt: 5,
  },
  { kanji: "生", reading: "せい", romaji: "sei", meaning: { en: "life, birth", ja: "生きる", es: "vida" }, jlpt: 5 },
  {
    kanji: "先",
    reading: "さき",
    romaji: "saki",
    meaning: { en: "before, ahead", ja: "先", es: "antes, adelante" },
    jlpt: 5,
  },
  { kanji: "名", reading: "な", romaji: "na", meaning: { en: "name", ja: "名前", es: "nombre" }, jlpt: 5 },
  { kanji: "女", reading: "おんな", romaji: "onna", meaning: { en: "woman", ja: "女性", es: "mujer" }, jlpt: 5 },
  { kanji: "男", reading: "おとこ", romaji: "otoko", meaning: { en: "man", ja: "男性", es: "hombre" }, jlpt: 5 },
  { kanji: "子", reading: "こ", romaji: "ko", meaning: { en: "child", ja: "子供", es: "niño" }, jlpt: 5 },

  // JLPT N4
  { kanji: "食", reading: "た", romaji: "ta", meaning: { en: "eat, food", ja: "食べる", es: "comer" }, jlpt: 4 },
  { kanji: "飲", reading: "の", romaji: "no", meaning: { en: "drink", ja: "飲む", es: "beber" }, jlpt: 4 },
  { kanji: "見", reading: "み", romaji: "mi", meaning: { en: "see, look", ja: "見る", es: "ver" }, jlpt: 4 },
  { kanji: "聞", reading: "き", romaji: "ki", meaning: { en: "hear, listen", ja: "聞く", es: "escuchar" }, jlpt: 4 },
  { kanji: "読", reading: "よ", romaji: "yo", meaning: { en: "read", ja: "読む", es: "leer" }, jlpt: 4 },
  { kanji: "書", reading: "か", romaji: "ka", meaning: { en: "write", ja: "書く", es: "escribir" }, jlpt: 4 },
  {
    kanji: "話",
    reading: "はなし",
    romaji: "hanashi",
    meaning: { en: "talk, story", ja: "話す", es: "hablar" },
    jlpt: 4,
  },
  { kanji: "言", reading: "い", romaji: "i", meaning: { en: "say, word", ja: "言う", es: "decir" }, jlpt: 4 },
  { kanji: "行", reading: "い", romaji: "i", meaning: { en: "go", ja: "行く", es: "ir" }, jlpt: 4 },
  { kanji: "来", reading: "く", romaji: "ku", meaning: { en: "come", ja: "来る", es: "venir" }, jlpt: 4 },
  {
    kanji: "帰",
    reading: "かえ",
    romaji: "kae",
    meaning: { en: "return home", ja: "帰る", es: "volver a casa" },
    jlpt: 4,
  },
  { kanji: "入", reading: "はい", romaji: "hai", meaning: { en: "enter", ja: "入る", es: "entrar" }, jlpt: 4 },
  { kanji: "出", reading: "で", romaji: "de", meaning: { en: "exit, leave", ja: "出る", es: "salir" }, jlpt: 4 },
  { kanji: "買", reading: "か", romaji: "ka", meaning: { en: "buy", ja: "買う", es: "comprar" }, jlpt: 4 },
  { kanji: "売", reading: "う", romaji: "u", meaning: { en: "sell", ja: "売る", es: "vender" }, jlpt: 4 },
  { kanji: "待", reading: "ま", romaji: "ma", meaning: { en: "wait", ja: "待つ", es: "esperar" }, jlpt: 4 },
  { kanji: "持", reading: "も", romaji: "mo", meaning: { en: "hold, have", ja: "持つ", es: "tener" }, jlpt: 4 },
  { kanji: "使", reading: "つか", romaji: "tsuka", meaning: { en: "use", ja: "使う", es: "usar" }, jlpt: 4 },
  { kanji: "作", reading: "つく", romaji: "tsuku", meaning: { en: "make, create", ja: "作る", es: "hacer" }, jlpt: 4 },
  { kanji: "知", reading: "し", romaji: "shi", meaning: { en: "know", ja: "知る", es: "saber" }, jlpt: 4 },
  { kanji: "思", reading: "おも", romaji: "omo", meaning: { en: "think", ja: "思う", es: "pensar" }, jlpt: 4 },
  { kanji: "会", reading: "あ", romaji: "a", meaning: { en: "meet", ja: "会う", es: "encontrar" }, jlpt: 4 },
  { kanji: "住", reading: "す", romaji: "su", meaning: { en: "live, reside", ja: "住む", es: "vivir" }, jlpt: 4 },
  { kanji: "働", reading: "はたら", romaji: "hatara", meaning: { en: "work", ja: "働く", es: "trabajar" }, jlpt: 4 },
  { kanji: "休", reading: "やす", romaji: "yasu", meaning: { en: "rest", ja: "休む", es: "descansar" }, jlpt: 4 },
  { kanji: "走", reading: "はし", romaji: "hashi", meaning: { en: "run", ja: "走る", es: "correr" }, jlpt: 4 },
  { kanji: "歩", reading: "ある", romaji: "aru", meaning: { en: "walk", ja: "歩く", es: "caminar" }, jlpt: 4 },
  { kanji: "立", reading: "た", romaji: "ta", meaning: { en: "stand", ja: "立つ", es: "estar de pie" }, jlpt: 4 },
  { kanji: "座", reading: "すわ", romaji: "suwa", meaning: { en: "sit", ja: "座る", es: "sentarse" }, jlpt: 4 },
  { kanji: "開", reading: "あ", romaji: "a", meaning: { en: "open", ja: "開く", es: "abrir" }, jlpt: 4 },

  // JLPT N3
  { kanji: "愛", reading: "あい", romaji: "ai", meaning: { en: "love", ja: "愛", es: "amor" }, jlpt: 3 },
  {
    kanji: "心",
    reading: "こころ",
    romaji: "kokoro",
    meaning: { en: "heart, mind", ja: "心", es: "corazón, mente" },
    jlpt: 3,
  },
  { kanji: "夢", reading: "ゆめ", romaji: "yume", meaning: { en: "dream", ja: "夢", es: "sueño" }, jlpt: 3 },
  { kanji: "空", reading: "そら", romaji: "sora", meaning: { en: "sky", ja: "空", es: "cielo" }, jlpt: 3 },
  { kanji: "海", reading: "うみ", romaji: "umi", meaning: { en: "sea, ocean", ja: "海", es: "mar" }, jlpt: 3 },
  { kanji: "花", reading: "はな", romaji: "hana", meaning: { en: "flower", ja: "花", es: "flor" }, jlpt: 3 },
  { kanji: "星", reading: "ほし", romaji: "hoshi", meaning: { en: "star", ja: "星", es: "estrella" }, jlpt: 3 },
  { kanji: "雨", reading: "あめ", romaji: "ame", meaning: { en: "rain", ja: "雨", es: "lluvia" }, jlpt: 3 },
  { kanji: "雪", reading: "ゆき", romaji: "yuki", meaning: { en: "snow", ja: "雪", es: "nieve" }, jlpt: 3 },
  { kanji: "風", reading: "かぜ", romaji: "kaze", meaning: { en: "wind", ja: "風", es: "viento" }, jlpt: 3 },
  { kanji: "光", reading: "ひかり", romaji: "hikari", meaning: { en: "light", ja: "光", es: "luz" }, jlpt: 3 },
  { kanji: "音", reading: "おと", romaji: "oto", meaning: { en: "sound", ja: "音", es: "sonido" }, jlpt: 3 },
  { kanji: "色", reading: "いろ", romaji: "iro", meaning: { en: "color", ja: "色", es: "color" }, jlpt: 3 },
  { kanji: "白", reading: "しろ", romaji: "shiro", meaning: { en: "white", ja: "白", es: "blanco" }, jlpt: 3 },
  { kanji: "黒", reading: "くろ", romaji: "kuro", meaning: { en: "black", ja: "黒", es: "negro" }, jlpt: 3 },
  { kanji: "赤", reading: "あか", romaji: "aka", meaning: { en: "red", ja: "赤", es: "rojo" }, jlpt: 3 },
  { kanji: "青", reading: "あお", romaji: "ao", meaning: { en: "blue", ja: "青", es: "azul" }, jlpt: 3 },
  { kanji: "時", reading: "とき", romaji: "toki", meaning: { en: "time", ja: "時", es: "tiempo" }, jlpt: 3 },
  { kanji: "朝", reading: "あさ", romaji: "asa", meaning: { en: "morning", ja: "朝", es: "mañana" }, jlpt: 3 },
  { kanji: "夜", reading: "よる", romaji: "yoru", meaning: { en: "night", ja: "夜", es: "noche" }, jlpt: 3 },
]

export function getRandomKanji(exclude?: Kanji): Kanji {
  let kanji: Kanji
  do {
    kanji = kanjiList[Math.floor(Math.random() * kanjiList.length)]
  } while (exclude && kanji.kanji === exclude.kanji)
  return kanji
}

export function getRandomOptions(correct: Kanji, count = 3): Kanji[] {
  const options: Kanji[] = [correct]
  const available = kanjiList.filter((k) => k.kanji !== correct.kanji)

  while (options.length < count && available.length > 0) {
    const randomIndex = Math.floor(Math.random() * available.length)
    options.push(available[randomIndex])
    available.splice(randomIndex, 1)
  }

  // Shuffle options
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[options[i], options[j]] = [options[j], options[i]]
  }

  return options
}
