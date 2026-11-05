import type { OfferQuestion } from "@/services/offerQuestions.service";

/** Limite de caracteres da resposta (Figma 2951-62820). */
export const ANSWER_MAX_LENGTH = 600;

export type QuestionStatusFilter = "all" | "unanswered" | "answered";

export interface QuestionsSummary {
  unanswered: number;
  answered: number;
  /** Respondidas sobre o total, de 0 a 1 (0 sem perguntas). */
  responseRate: number;
}

export function summarizeQuestions(
  questions: OfferQuestion[],
): QuestionsSummary {
  const answered = questions.filter((item) => item.answer).length;
  return {
    unanswered: questions.length - answered,
    answered,
    responseRate: questions.length ? answered / questions.length : 0,
  };
}

export interface QuestionsFilter {
  search: string;
  /** Oferta; vazio = todas. */
  offeringId: string;
  status: QuestionStatusFilter;
}

/** Busca na oferta, na pergunta, na resposta e no protocolo. */
export function filterQuestions(
  questions: OfferQuestion[],
  { search, offeringId, status }: QuestionsFilter,
): OfferQuestion[] {
  const term = search.trim().toLowerCase();
  return questions.filter((item) => {
    if (offeringId && item.offeringId !== offeringId) return false;
    if (status === "answered" && !item.answer) return false;
    if (status === "unanswered" && item.answer) return false;
    if (!term) return true;
    return [item.offeringName, item.question, item.answer?.text, item.protocol]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(term));
  });
}

/** Horas entre a pergunta e a resposta (1 casa). */
export function responseHours(question: OfferQuestion): number | null {
  if (!question.answer) return null;
  const ms =
    new Date(question.answer.answeredAt).getTime() -
    new Date(question.askedAt).getTime();
  return Number.isFinite(ms) ? Math.max(0, ms) / 3_600_000 : null;
}

// Contatos e links: e-mail, URL ou domínio, telefone (8+ dígitos, com ou sem
// separadores) e menção a apps de mensagem.
const BLOCKED_PATTERNS = [
  /[\w.+-]+@[\w-]+\.[\w.-]+/i,
  /\b(?:https?:\/\/|www\.)\S+/i,
  /\b[\w-]+\.(?:com|net|org|br|io|app|me|info)(?:\.br)?\b/i,
  /(?:\+?\d[\s().-]?){8,}/,
  /\b(?:whats\s?app|wpp|zap|telegram|signal)\b/i,
];

/**
 * A resposta traz contato, link externo ou app de mensagem? Mesmo filtro
 * que a plataforma aplica às respostas públicas (RN-RFQ-02) — o servidor
 * confere de novo.
 */
export function hasBlockedContent(text: string): boolean {
  return BLOCKED_PATTERNS.some((pattern) => pattern.test(text));
}
