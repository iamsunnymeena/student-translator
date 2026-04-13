const STORAGE_KEY = "student-translator-saved-words";

export function loadSavedWords() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function saveWord(word) {
  const current = loadSavedWords();
  const duplicate = current.some(
    (entry) => entry.sourceText === word.sourceText && entry.targetLang === word.targetLang,
  );

  const next = duplicate
    ? current
    : [
        {
          ...word,
          id: word.id || `${Date.now()}-${word.sourceLang}-${word.targetLang}`,
          savedAt: word.savedAt || new Date().toISOString(),
        },
        ...current,
      ];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function removeSavedWord(id) {
  const next = loadSavedWords().filter((word) => word.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
