export type CurriculumUnit = {
  id: number;
  title: string;
  summary: string;
  exampleSentences: string[];
};

export const curriculum: CurriculumUnit[] = [
  {
    id: 1,
    title: "Introductions and Occupations",
    summary:
      "This unit establishes the foundation for introducing yourself and asking about others. You will learn to state your name and occupation, form basic negative sentences, ask yes/no questions, and use the particle も (mo) to say 'also'.",
    exampleSentences: [
      "わたし は マイク・ミラー です。 (I am Mike Miller)",
      "サントス[さんとす] さん は 学生[がくせい] じゃ ありません。 (Mr. Santos is not a student)",
      "ミラー[みらー] さん は 会社員[かいしゃいん] ですか。 (Is Mr. Miller a company employee?)",
      "サントス[さんとす] さん も 会社員[かいしゃいん] です。 (Mr. Santos is also a company employee)",
      "あなた は 学生[がくせい] ですか。 (Are you a student?)",
      "やまだ さん は 銀行員[ぎんこういん] ですか。 (Is Mr. Yamada a bank employee?)",
      "ワン[わん] さん は 会社員[かいしゃいん] じゃ ありません。 (Mr. Wang is not a company employee)",
      "やまだ さん は なんさい ですか。 (How old is Mr. Yamada?)",
      "あの 人[ひと] は だれ ですか。 (Who is that person?)",
      "わたし は ブラジル[ぶらじる] から きました。 (I came from Brazil)",
    ],
  },
  {
    id: 2,
    title: "Objects and Possession",
    summary:
      "The focus shifts to identifying physical items around you. You will learn to use demonstratives like これ (this), それ (that), and あれ (that over there) to point out objects, and the particle の (no) to indicate possession or describe what an object is about.",
    exampleSentences: [
      "これ は 辞書[じしょ] です。 (This is a dictionary)",
      "それ は わたし の 傘[かさ] です. (That is my umbrella)",
      "この 本[ほん] は わたし の です。 (This book is mine)",
      "これ は 鉛筆[えんぴつ] ですか。 (Is this a pencil?)",
      "これ は なん ですか。 (What is this?)",
      "これ は 本[ほん] じゃ ありません. (This is not a book)",
      "それ は なん の 雑誌[ざっし] ですか。 (What kind of magazine is that?)",
      "これ は 本[ほん] ですか、雑誌[ざっし] ですか。 (Is this a book or a magazine?)",
      "それ は だれ の カメラ[かめら] ですか。 (Whose camera is that?)",
      "あの 傘[かさ] は わたし の です。 (That umbrella over there is mine)",
    ],
  },
  {
    id: 3,
    title: "Places, Numbers, and Shopping",
    summary:
      "This unit teaches you how to ask for and give directions, expanding on demonstratives to include places (here, there, over there). You will also learn numbers up to 10,000, which will allow you to ask for prices and make purchases, as well as ask where a product was manufactured.",
    exampleSentences: [
      "ここ は 食堂[しょくどう] です。 (This place is the dining hall)",
      "エレベーター[えれべーたー] は あそこ です。 (The elevator is over there)",
      "こばやし 先生[せんせい] は どこ ですか。 (Where is Mr. Kobayashi?)",
      "先生[せんせい] は 事務所[じむしょ] です。 (The teacher is in the office)",
      "あの 方[かた] は どなた ですか。 (Who is that person?)",
      "カメラ[かめら] は どこ ですか。 (Where is the camera?)",
      "あれ は だれ の かばん ですか。 (Whose bag is that?)",
      "ここ は わたし の 部屋[へや] じゃ ありません。 (This is not my room)",
      "この ネクタイ[ねくたい] は 1,500円[えん] です。 (This tie is 1,500 yen)",
      "わたし の 時計[とけい] は 日本[にほん] の です。 (My clock is from Japan)",
    ],
  },
  {
    id: 4,
    title: "Time, Days, and Basic Verbs",
    summary:
      "This is a major structural unit that introduces verbs for the first time. You will learn how to state the time and day, say when an action starts and ends (from ~ to ~), and conjugate basic verbs (wake up, sleep, work, study) into their present, past, and negative forms.",
    exampleSentences: [
      "今[いま] 4時5分[よじごふん] です。 (It is 4:05 right now)",
      "わたし は 毎朝[まいあさ] 6時[ろくじ] に 起きます[おきます]。 (I wake up at 6 every morning)",
      "わたし は きのう 勉強[べんきょう] しました。 (I studied yesterday)",
      "きむら さん は まいにち 7時[しちじ] に 起きます[おきます]。 (Mr. Kimura wakes up at 7 every day)",
      "9時[くじ] から 5時15分[ごじじゅうごふん] まで 働きます[はたらきます]。 (I work from 9:00 to 5:15)",
      "11時[じゅういちじ] に 寝ます[ねます]。 (I go to sleep at 11:00)",
      "日曜日[にちようび] 休みます[やすみます]。 (I rest on Sunday)",
      "学校[がっこう] は 月曜日[げつようび] から 金曜日[きんようび] まで です。 (School is from Monday to Friday)",
      "9時[くじ] から 3時半[さんじはん] まで です。 (It is from 9:00 to 3:30)",
      "昼休み[ひるやすみ] は 12時[じゅうにじ] から 1時[いちじ] まで です. (The lunch break is from 12:00 to 1:00)",
    ],
  },
];
