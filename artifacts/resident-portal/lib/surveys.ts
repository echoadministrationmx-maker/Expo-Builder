export type ActiveSurvey = {
  id: number;
  pregunta: string;
  opciones: string[];
  total: number;
  conteos: Record<string, number>;
  mi_voto: number | null;
};

export function normalizeActiveSurveys(value: unknown): ActiveSurvey[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const survey = item as Record<string, unknown>;
    const options = Array.isArray(survey.opciones)
      ? survey.opciones
          .filter((option): option is string => typeof option === "string")
          .map((option) => option.trim())
          .filter(Boolean)
      : [];
    const id = Number(survey.id);

    if (!Number.isFinite(id) || typeof survey.pregunta !== "string" || !options.length) {
      return [];
    }

    const rawCounts =
      survey.conteos && typeof survey.conteos === "object"
        ? (survey.conteos as Record<string, unknown>)
        : {};
    const counts = Object.fromEntries(
      Object.entries(rawCounts).map(([key, count]) => [
        key,
        Math.max(0, Number(count) || 0),
      ]),
    );
    const ownVote =
      survey.mi_voto === null || survey.mi_voto === undefined
        ? null
        : Number(survey.mi_voto);

    return [
      {
        id,
        pregunta: survey.pregunta.trim(),
        opciones: options,
        total: Math.max(0, Number(survey.total) || 0),
        conteos: counts,
        mi_voto: Number.isInteger(ownVote) ? ownVote : null,
      },
    ];
  });
}

export function surveyPercentage(count: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((Math.max(0, count) / total) * 100);
}
