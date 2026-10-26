// Authored examples, with expected spans reviewed independently of the matcher.
export type PassageCase = {
  name: string
  target: string
  source: string[]
  text: string
  spans: [number, number, string][]
}

export const development: PassageCase[] = [
  {
    name: 'complete prose sentences', target: 'EN-US',
    source: ['雨が降っています。', '窓を閉めます。'], text: 'It is raining.\nI will close the window.',
    spans: [[0, 0, 'It is raining.'], [1, 1, 'I will close the window.']],
  },
  {
    name: 'one sentence spanning multiple source lines', target: 'ES',
    source: ['窓を開けると', '冷たい風が入った。', '部屋は静かだった。'],
    text: 'Al abrir la ventana, entró un viento frío.\nLa habitación estaba tranquila.',
    spans: [[0, 1, 'Al abrir la ventana, entró un viento frío.'], [2, 2, 'La habitación estaba tranquila.']],
  },
  {
    name: 'target expands a sentence into lines', target: 'DE',
    source: ['橋を渡った。', '駅で待った。'], text: 'Ich überquerte\ndie Brücke.\nIch wartete am Bahnhof.',
    spans: [[0, 0, 'Ich überquerte\ndie Brücke.'], [1, 1, 'Ich wartete am Bahnhof.']],
  },
  {
    name: 'reordered shared names need one group', target: 'FR',
    source: ['ALPHAを先に', 'BETAを後に'], text: 'BETA après\nALPHA en premier',
    spans: [[0, 1, 'BETA après\nALPHA en premier']],
  },
  {
    name: 'formatting shift hidden by equal line counts', target: 'EN-US',
    source: ['朝になった。', '鳥が鳴いた。', '家を出た。'], text: 'Morning arrived\nand the birds sang. I left\nthe house.',
    spans: [[0, 2, 'Morning arrived\nand the birds sang. I left\nthe house.']],
  },
  {
    name: 'stanzas preserve boundaries without shared script', target: 'AR',
    source: ['夜が明ける', '', '海が光る'], text: 'يطلع الفجر\n\nيلمع البحر',
    spans: [[0, 0, 'يطلع الفجر'], [1, 1, ''], [2, 2, 'يلمع البحر']],
  },
  {
    name: 'one question among unpunctuated lyric lines', target: 'EN-US',
    source: ['夜明けの街を歩く', '君の声が聞こえる', 'どうして？', 'もう一度会いたい'],
    text: 'Walking through the city at dawn\nI can hear your voice\nWhy?\nI want to see you again',
    spans: [
      [0, 0, 'Walking through the city at dawn'], [1, 1, 'I can hear your voice'], [2, 2, 'Why?'],
      [3, 3, 'I want to see you again'],
    ],
  },
  {
    name: 'translation adds periods to lyric lines around an exclamation', target: 'ES',
    source: ['走れ 夜を越えて！', '光の方へ', '迷わないで'],
    text: '¡Corre, atraviesa la noche!\nHacia la luz.\nNo te pierdas.',
    spans: [[0, 0, '¡Corre, atraviesa la noche!'], [1, 1, 'Hacia la luz.'], [2, 2, 'No te pierdas.']],
  },
  {
    name: 'stanzas survive balanced sentence marks', target: 'EN-US',
    source: ['窓の外は雨', '君はいない', '', '覚えてる？', 'あの日の約束'],
    text: 'Rain outside the window\nYou are not here\n\nDo you remember?\nThe promise of that day',
    spans: [
      [0, 0, 'Rain outside the window'], [1, 1, 'You are not here'], [2, 2, ''], [3, 3, 'Do you remember?'],
      [4, 4, 'The promise of that day'],
    ],
  },
  {
    name: 'a source sentence end continued by the target line', target: 'EN-US',
    source: ['朝になった。', '鳥が鳴いた', '家を出た'], text: 'Morning\ncame and the birds sang.\nI left the house.',
    spans: [[0, 1, 'Morning\ncame and the birds sang.'], [2, 2, 'I left the house.']],
  },
]

// Do not select rules from this set. Keep failures visible instead of adding content exceptions.
export const heldOut: PassageCase[] = [
  {
    name: 'repeated dialogue retains occurrence identity', target: 'FR',
    source: ['行こう', 'まだ待って', '行こう'], text: 'Allons-y\nAttends encore\nPartons',
    spans: [[0, 0, 'Allons-y'], [1, 1, 'Attends encore'], [2, 2, 'Partons']],
  },
  {
    name: 'merged target sentence followed by independent sentence', target: 'AR',
    source: ['本を閉じた。', '電気を消した。', '外は暗かった。'],
    text: 'أغلقت الكتاب. أطفأت الضوء.\nكان الخارج مظلمًا.',
    spans: [[0, 1, 'أغلقت الكتاب. أطفأت الضوء.'], [2, 2, 'كان الخارج مظلمًا.']],
  },
  {
    name: 'CJK target with no unchanged anchors', target: 'ZH-HANS',
    source: ['春が来た。', '花が咲いた。'], text: '春天来了。\n花开了。',
    spans: [[0, 0, '春天来了。'], [1, 1, '花开了。']],
  },
  {
    name: 'one source line covers several translated sentences', target: 'DE',
    source: ['扉を開けた。誰もいなかった。', '階段を下りた。'],
    text: 'Ich öffnete die Tür.\nNiemand war da.\nIch ging die Treppe hinunter.',
    spans: [[0, 0, 'Ich öffnete die Tür.\nNiemand war da.'], [1, 1, 'Ich ging die Treppe hinunter.']],
  },
  {
    name: 'unchanged identifier bounds an otherwise uncertain lyric', target: 'PT-BR',
    source: ['名前を呼んで', '遠くまで', 'ROOM42で待つ', '夜が明ける'],
    text: 'Chame meu nome até longe\nEspere em ROOM42\nO dia amanhece',
    spans: [[0, 1, 'Chame meu nome até longe'], [2, 2, 'Espere em ROOM42'], [3, 3, 'O dia amanhece']],
  },
  {
    name: 'repeated anchors cannot resolve an expanded chorus', target: 'ES-419',
    source: ['LUNAと歌う', 'LUNAと帰る', '眠る'], text: 'Cantar con LUNA\nvolver\ncon LUNA\ndormir',
    spans: [[0, 2, 'Cantar con LUNA\nvolver\ncon LUNA\ndormir']],
  },
]
