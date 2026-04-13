# Student Translator - English Hindi Learning App

Student Translator is a free, mobile-first React PWA for English and Hindi learners. It translates in both directions with LibreTranslate, gives a meaning area, example sentence, text pronunciation hint, speech output, voice input where supported, word of the day, saved words, flashcards, quiz practice, and dark mode.

## Project Structure

```text
student-translator/
├── public/
│   ├── icons/
│   │   └── icon.svg
│   ├── manifest.webmanifest
│   └── sw.js
├── src/
│   ├── main.jsx
│   ├── setupTests.js
│   ├── storage.js
│   ├── styles.css
│   ├── translator.js
│   └── translator.test.js
├── eslint.config.js
├── index.html
├── package.json
├── vercel.json
└── vite.config.js
```

## Features

- English to Hindi and Hindi to English translation through LibreTranslate-compatible endpoints.
- Optional custom LibreTranslate endpoint and API key fields for self-hosted or managed servers.
- Learning output with translated sentence, example sentence, and pronunciation hint.
- Word of the Day with one-tap saving.
- Saved words stored in browser localStorage.
- Flashcards generated from saved words.
- MCQ quiz generated from saved translations.
- PWA manifest and service worker for mobile installation and offline app shell.
- Bonus features: Web Speech voice input, speech output, and dark mode.

## Local Setup

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Testing

```bash
npm test
npm run build
```

Translation requires an internet connection because the app calls LibreTranslate-compatible APIs directly from the browser. The public `libretranslate.com` endpoint may require an API key, so the app includes settings for a custom endpoint or key.

## Deployment

### Vercel

```bash
npm install
npm run build
npx vercel
```

Use these settings if Vercel asks:

- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`

### Netlify

```bash
npm install
npm run build
npx netlify deploy --prod --dir=dist
```

### GitHub Pages

Push to `main` and the included workflow deploys automatically.  
Live URL pattern: `https://iamsunnymeena.github.io/student-translator/`

## GitHub

```bash
git init
git add .
git commit -m "Build student translator app"
gh repo create student-translator --public --source=. --remote=origin --push
```
