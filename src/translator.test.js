import { describe, expect, it } from "vitest";
import {
  buildExampleSentence,
  buildPronunciation,
  createQuizQuestions,
  getWordOfTheDay,
  normalizeDirection,
} from "./translator.js";

describe("translator helpers", () => {
  it("normalizes translation directions", () => {
    expect(normalizeDirection("en-hi")).toEqual({ source: "en", target: "hi" });
    expect(normalizeDirection("hi-en")).toEqual({ source: "hi", target: "en" });
  });

  it("builds learning examples in the target language", () => {
    expect(buildExampleSentence("book", "किताब", "hi")).toContain("किताब");
    expect(buildExampleSentence("किताब", "book", "en")).toContain("book");
  });

  it("creates pronunciation hints", () => {
    expect(buildPronunciation("किताब", "hi")).toBeTruthy();
    expect(buildPronunciation("education", "en")).toContain("shun");
  });

  it("returns a stable word of the day", () => {
    const day = new Date("2026-04-13T00:00:00.000Z");
    expect(getWordOfTheDay(day).id).toContain("2026-04-13");
  });

  it("creates quiz questions from saved words", () => {
    const questions = createQuizQuestions([
      { id: "1", sourceText: "book", translatedText: "किताब" },
      { id: "2", sourceText: "pen", translatedText: "कलम" },
    ]);

    expect(questions).toHaveLength(2);
    expect(questions[0].options).toContain("किताब");
  });
});
