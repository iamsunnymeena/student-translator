export const DEFAULT_LIBRE_ENDPOINTS = [
  "https://translate.cutie.dating/translate",
  "https://libretranslate.com/translate",
  "https://translate.argosopentech.com/translate",
];

const WORDS_OF_THE_DAY = [
  {
    sourceText: "Curiosity",
    translatedText: "जिज्ञासा",
    sourceLang: "en",
    targetLang: "hi",
    example: "जिज्ञासा से सीखना आसान हो जाता है.",
    pronunciation: "jigyasa",
  },
  {
    sourceText: "Practice",
    translatedText: "अभ्यास",
    sourceLang: "en",
    targetLang: "hi",
    example: "रोज अभ्यास करने से भाषा मजबूत होती है.",
    pronunciation: "abhyaas",
  },
  {
    sourceText: "साहस",
    translatedText: "Courage",
    sourceLang: "hi",
    targetLang: "en",
    example: "Courage helps students speak with confidence.",
    pronunciation: "kuh-rij",
  },
  {
    sourceText: "Gratitude",
    translatedText: "कृतज्ञता",
    sourceLang: "en",
    targetLang: "hi",
    example: "कृतज्ञता मन को शांत रखती है.",
    pronunciation: "kritagyata",
  },
  {
    sourceText: "विचार",
    translatedText: "Thought",
    sourceLang: "hi",
    targetLang: "en",
    example: "A clear thought becomes a clear sentence.",
    pronunciation: "thawt",
  },
  {
    sourceText: "Improve",
    translatedText: "सुधारना",
    sourceLang: "en",
    targetLang: "hi",
    example: "हर दिन थोड़ा सुधारना अच्छा लक्ष्य है.",
    pronunciation: "sudharna",
  },
  {
    sourceText: "समय",
    translatedText: "Time",
    sourceLang: "hi",
    targetLang: "en",
    example: "Time is useful when it is used with care.",
    pronunciation: "taim",
  },
];

const HINDI_PRONUNCIATION_HINTS = {
  अ: "a",
  आ: "aa",
  इ: "i",
  ई: "ee",
  उ: "u",
  ऊ: "oo",
  ए: "e",
  ऐ: "ai",
  ओ: "o",
  औ: "au",
  क: "ka",
  ख: "kha",
  ग: "ga",
  घ: "gha",
  च: "cha",
  ज: "ja",
  ट: "ta",
  ड: "da",
  त: "ta",
  द: "da",
  न: "na",
  प: "pa",
  ब: "ba",
  म: "ma",
  य: "ya",
  र: "ra",
  ल: "la",
  व: "va",
  स: "sa",
  ह: "ha",
  श: "sha",
  ष: "sha",
};

export function normalizeDirection(direction) {
  return direction === "hi-en" ? { source: "hi", target: "en" } : { source: "en", target: "hi" };
}

export async function translateText(text, source, target, options = {}) {
  let lastError;
  const endpoints = [options.endpoint, ...DEFAULT_LIBRE_ENDPOINTS].filter(Boolean);

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: text,
          source,
          target,
          format: "text",
          api_key: options.apiKey || "",
        }),
      });

      if (!response.ok) {
        throw new Error(`Translation service returned ${response.status}.`);
      }

      const data = await response.json();
      if (!data.translatedText) {
        throw new Error("Translation service did not return translated text.");
      }
      return data.translatedText;
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(
    lastError?.message
      ? `Translation failed: ${lastError.message}. Try setting a custom LibreTranslate endpoint in settings.`
      : "Translation failed. Check internet or add a custom LibreTranslate endpoint in settings.",
  );
}

export function buildExampleSentence(sourceText, translatedText, targetLang) {
  if (targetLang === "hi") {
    return `मैंने आज "${translatedText}" शब्द सीखा.`;
  }

  return `Today I learned the word "${translatedText}".`;
}

export function buildPronunciation(text, lang) {
  if (!text) return "Pronunciation will appear after translation.";

  if (lang === "en") {
    return text
      .toLowerCase()
      .replace(/tion\b/g, "shun")
      .replace(/ph/g, "f")
      .replace(/ough/g, "oh")
      .replace(/[^\w\s-]/g, "")
      .trim();
  }

  const hint = Array.from(text)
    .slice(0, 18)
    .map((char) => HINDI_PRONUNCIATION_HINTS[char] || (/\s/.test(char) ? " " : ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return hint || "Use the listen button for pronunciation.";
}

export function getWordOfTheDay(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  const day = Math.floor(diff / 86400000);
  const word = WORDS_OF_THE_DAY[day % WORDS_OF_THE_DAY.length];

  return {
    ...word,
    id: `word-day-${date.toISOString().slice(0, 10)}`,
    savedAt: new Date().toISOString(),
  };
}

export function createQuizQuestions(words) {
  return words.slice(0, 8).map((word, index) => {
    const distractors = words
      .filter((candidate) => candidate.id !== word.id)
      .map((candidate) => candidate.translatedText)
      .slice(0, 3);
    const fallback = ["I know", "मैं सीखता हूँ", "Language", "भाषा"].filter(
      (option) => option !== word.translatedText,
    );
    const options = shuffle([word.translatedText, ...distractors, ...fallback].slice(0, 4), index);

    return {
      id: word.id,
      prompt: `Translate: ${word.sourceText}`,
      answer: word.translatedText,
      options,
    };
  });
}

function shuffle(values, seed) {
  return [...values].sort((a, b) => ((a.length + seed) % 3) - ((b.length + seed) % 3));
}
