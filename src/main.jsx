import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import {
  buildExampleSentence,
  buildPronunciation,
  createQuizQuestions,
  getWordOfTheDay,
  normalizeDirection,
  translateText,
} from "./translator.js";
import { loadSavedWords, saveWord, removeSavedWord } from "./storage.js";

const NAV_ITEMS = [
  { id: "translate", label: "Translate" },
  { id: "flashcards", label: "Flashcards" },
  { id: "quiz", label: "Quiz" },
];
const BASE_URL = import.meta.env.BASE_URL;

function App() {
  const [page, setPage] = useState("translate");
  const [savedWords, setSavedWords] = useState(() => loadSavedWords());
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register(`${BASE_URL}sw.js`).catch(() => {});
    }
  }, []);

  const wordOfTheDay = useMemo(() => getWordOfTheDay(new Date()), []);

  function handleSave(entry) {
    const next = saveWord(entry);
    setSavedWords(next);
  }

  function handleRemove(id) {
    const next = removeSavedWord(id);
    setSavedWords(next);
  }

  return (
    <main className="app-shell">
      <Header darkMode={darkMode} onToggleTheme={() => setDarkMode((value) => !value)} />
      <nav className="tabs" aria-label="Main sections">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={page === item.id ? "active" : ""}
            onClick={() => setPage(item.id)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </nav>

      {page === "translate" && (
        <TranslatorPage
          onSave={handleSave}
          savedWords={savedWords}
          wordOfTheDay={wordOfTheDay}
        />
      )}
      {page === "flashcards" && <FlashcardsPage words={savedWords} onRemove={handleRemove} />}
      {page === "quiz" && <QuizPage words={savedWords} />}
    </main>
  );
}

function Header({ darkMode, onToggleTheme }) {
  return (
    <header className="hero">
      <div>
        <p className="eyebrow">English ↔ Hindi</p>
        <h1>Student Translator</h1>
        <p className="hero-copy">Translate, save, listen, and practice words in small daily steps.</p>
      </div>
      <img className="hero-mark" src={`${BASE_URL}icons/icon.svg`} alt="" aria-hidden="true" />
      <button className="theme-toggle" type="button" onClick={onToggleTheme}>
        {darkMode ? "Light" : "Dark"}
      </button>
    </header>
  );
}

function TranslatorPage({ onSave, savedWords, wordOfTheDay }) {
  const [text, setText] = useState("");
  const [direction, setDirection] = useState("en-hi");
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [apiEndpoint, setApiEndpoint] = useState(() => localStorage.getItem("libretranslate-endpoint") || "");
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("libretranslate-api-key") || "");

  const { source, target } = normalizeDirection(direction);
  const canSpeak = "speechSynthesis" in window;
  const canListen = "webkitSpeechRecognition" in window || "SpeechRecognition" in window;

  async function handleTranslate() {
    const trimmed = text.trim();
    if (!trimmed) {
      setError("Type a word or sentence first.");
      return;
    }

    setStatus("loading");
    setError("");
    try {
      localStorage.setItem("libretranslate-endpoint", apiEndpoint.trim());
      localStorage.setItem("libretranslate-api-key", apiKey.trim());
      const translatedText = await translateText(trimmed, source, target, {
        endpoint: apiEndpoint.trim(),
        apiKey: apiKey.trim(),
      });
      setResult({
        id: `${Date.now()}-${source}-${target}`,
        sourceText: trimmed,
        translatedText,
        sourceLang: source,
        targetLang: target,
        example: buildExampleSentence(trimmed, translatedText, target),
        pronunciation: buildPronunciation(translatedText, target),
        savedAt: new Date().toISOString(),
      });
      setStatus("success");
    } catch (translationError) {
      setError(translationError.message);
      setStatus("error");
    }
  }

  function handleVoiceInput() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return;
    const recognition = new Recognition();
    recognition.lang = source === "hi" ? "hi-IN" : "en-IN";
    recognition.interimResults = false;
    recognition.onresult = (event) => setText(event.results[0][0].transcript);
    recognition.start();
  }

  function speak(value, lang) {
    if (!canSpeak || !value) return;
    const utterance = new SpeechSynthesisUtterance(value);
    utterance.lang = lang === "hi" ? "hi-IN" : "en-IN";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  const isSaved = result && savedWords.some((word) => word.sourceText === result.sourceText && word.targetLang === result.targetLang);

  return (
    <section className="page-grid">
      <article className="translator-panel">
        <label htmlFor="direction">Translation direction</label>
        <select id="direction" value={direction} onChange={(event) => setDirection(event.target.value)}>
          <option value="en-hi">English to Hindi</option>
          <option value="hi-en">Hindi to English</option>
        </select>

        <label htmlFor="sourceText">Text to translate</label>
        <textarea
          id="sourceText"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={source === "en" ? "Type an English word or sentence" : "हिंदी शब्द या वाक्य लिखें"}
          rows="7"
        />

        <details className="api-settings">
          <summary>LibreTranslate settings</summary>
          <label htmlFor="apiEndpoint">Custom endpoint</label>
          <input
            id="apiEndpoint"
            value={apiEndpoint}
            onChange={(event) => setApiEndpoint(event.target.value)}
            placeholder="https://your-libretranslate-server.com/translate"
            inputMode="url"
          />
          <label htmlFor="apiKey">API key, if your server needs one</label>
          <input
            id="apiKey"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="Optional"
            type="password"
          />
        </details>

        {error && <p className="error" role="alert">{error}</p>}

        <div className="button-row">
          <button className="primary-button" type="button" onClick={handleTranslate} disabled={status === "loading"}>
            {status === "loading" ? "Translating..." : "Translate"}
          </button>
          <button className="secondary-button" type="button" onClick={handleVoiceInput} disabled={!canListen}>
            Voice input
          </button>
        </div>
      </article>

      <article className="output-panel">
        <h2>Meaning</h2>
        {result ? (
          <>
            <p className="source-text">{result.sourceText}</p>
            <p className="translated-text">{result.translatedText}</p>
            <dl className="learning-list">
              <div>
                <dt>Example</dt>
                <dd>{result.example}</dd>
              </div>
              <div>
                <dt>Pronunciation</dt>
                <dd>{result.pronunciation}</dd>
              </div>
            </dl>
            <div className="button-row">
              <button className="secondary-button" type="button" onClick={() => speak(result.translatedText, result.targetLang)}>
                Listen
              </button>
              <button className="primary-button" type="button" onClick={() => onSave(result)} disabled={isSaved}>
                {isSaved ? "Saved" : "Save word"}
              </button>
            </div>
          </>
        ) : (
          <p className="empty-state">Your translation and study notes will appear here.</p>
        )}
      </article>

      <WordOfTheDay word={wordOfTheDay} onSave={onSave} />
    </section>
  );
}

function WordOfTheDay({ word, onSave }) {
  return (
    <article className="word-day">
      <div>
        <p className="eyebrow">Word of the Day</p>
        <h2>{word.sourceText}</h2>
        <p>{word.translatedText}</p>
        <small>{word.example}</small>
      </div>
      <button className="secondary-button" type="button" onClick={() => onSave(word)}>
        Save
      </button>
    </article>
  );
}

function FlashcardsPage({ words, onRemove }) {
  const [activeId, setActiveId] = useState(null);

  if (!words.length) {
    return <EmptyStudyState title="No saved words yet" copy="Save translations to build your flashcard deck." />;
  }

  return (
    <section className="cards-grid" aria-label="Saved word flashcards">
      {words.map((word) => {
        const flipped = activeId === word.id;
        return (
          <article className="flashcard" key={word.id}>
            <button type="button" onClick={() => setActiveId(flipped ? null : word.id)} aria-pressed={flipped}>
              <span>{flipped ? word.translatedText : word.sourceText}</span>
              <small>{flipped ? word.pronunciation : "Tap to flip"}</small>
            </button>
            <p>{word.example}</p>
            <button className="link-button" type="button" onClick={() => onRemove(word.id)}>
              Remove
            </button>
          </article>
        );
      })}
    </section>
  );
}

function QuizPage({ words }) {
  const questions = useMemo(() => createQuizQuestions(words), [words]);
  const [answers, setAnswers] = useState({});

  if (words.length < 2) {
    return <EmptyStudyState title="Save at least two words" copy="Quiz choices need a small saved-word set." />;
  }

  const score = questions.reduce((total, question) => total + (answers[question.id] === question.answer ? 1 : 0), 0);

  return (
    <section className="quiz-panel">
      <div className="quiz-header">
        <h2>Translation Quiz</h2>
        <p>{score} / {questions.length} correct</p>
      </div>
      {questions.map((question) => (
        <article className="question" key={question.id}>
          <h3>{question.prompt}</h3>
          <div className="options">
            {question.options.map((option) => {
              const selected = answers[question.id] === option;
              const answered = question.id in answers;
              const isCorrect = option === question.answer;
              return (
                <button
                  className={`${selected ? "selected" : ""} ${answered && isCorrect ? "correct" : ""}`}
                  key={option}
                  type="button"
                  onClick={() => setAnswers((current) => ({ ...current, [question.id]: option }))}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </article>
      ))}
    </section>
  );
}

function EmptyStudyState({ title, copy }) {
  return (
    <section className="study-empty">
      <h2>{title}</h2>
      <p>{copy}</p>
    </section>
  );
}

createRoot(document.getElementById("root")).render(<App />);
