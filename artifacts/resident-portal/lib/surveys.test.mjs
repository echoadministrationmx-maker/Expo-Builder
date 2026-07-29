import assert from "node:assert/strict";
import test from "node:test";
import { normalizeActiveSurveys, surveyPercentage } from "./surveys.ts";

test("normalizes valid active surveys and ignores malformed records", () => {
  assert.deepEqual(
    normalizeActiveSurveys([
      {
        id: "8",
        pregunta: "¿Horario de la alberca?",
        opciones: [" 8:00 ", "10:00"],
        total: "4",
        conteos: { 0: 3, 1: "1" },
        mi_voto: "0",
      },
      { id: null, pregunta: "Invalid", opciones: [] },
    ]),
    [
      {
        id: 8,
        pregunta: "¿Horario de la alberca?",
        opciones: ["8:00", "10:00"],
        total: 4,
        conteos: { 0: 3, 1: 1 },
        mi_voto: 0,
      },
    ],
  );
});

test("calculates rounded poll percentages safely", () => {
  assert.equal(surveyPercentage(2, 3), 67);
  assert.equal(surveyPercentage(2, 0), 0);
});
