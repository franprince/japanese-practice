# Kana Words

Practice hiragana and katakana via romaji input with streaks, filters, and multilingual UI.

## Features
- Modes: Hiragana, Katakana, Both
- Filtering: character groups, word length
- Dynamic dictionary loading with IndexedDB cache (worker-based)
- i18n: English, Spanish, Japanese
- Sokuon rule support (small っ / ッ doubles the consonant)
- Persistent preferences (language, mode, filters)
- Shadcn-styled UI with keyboard-friendly flow

## Tech Stack
- Next.js (App Router) + React
- Bun runtime + bunx
- TypeScript, Tailwind CSS, shadcn/ui
- IndexedDB + Web Workers for word loading

## Getting Started
Install dependencies:
```bash
bun install
```

Run dev server:
```bash
bun dev
```

Build for production:
```bash
bun run build
```

Start production build:
```bash
bun start
```

## Data & Licensing
- Uses `data/jmdict-spa-3.6.1.json` (tracked via Git LFS).
- Dictionary sources: JMdict/EDICT and KANJIDIC from the Electronic Dictionary Research and Development Group, used per their licence.
- See footer links in-app for JMdict/EDICT/KANJIDIC and licence details.

## Deployment
The app is deployed on Vercel. To deploy:
```bash
vercel --prod
```
