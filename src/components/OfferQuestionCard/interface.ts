import type { OfferQuestion } from "@/services/offerQuestions.service";

/** Resultado da publicação: erro como chave de tradução. */
export type AnswerResult = { ok: true } | { ok: false; errorKey: string };

export interface OfferQuestionCardProps {
  question: OfferQuestion;
  /** Idioma das datas e números (ex.: "pt-BR"). */
  locale: string;
  /** Publica a resposta (só nas perguntas sem resposta). */
  onAnswer: (questionId: string, text: string) => Promise<AnswerResult>;
}
