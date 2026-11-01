// Perguntas públicas nas ofertas (RN-RFQ-02, complemento proposto, pendente
// de aprovação): qualquer buyer que vê a oferta pergunta; a pergunta e a
// resposta ficam visíveis para todos, com o buyer identificado só como
// "comprador verificado". Dono, Comercial, Operação e Suporte do seller
// respondem; o tempo de resposta entra no ranking.
//
// Nenhuma API da Neutra+ tem hoje as perguntas públicas (marketplace, RFQ e
// communication não expõem a rota). A tela está pronta e chama este service;
// até a rota existir, `answer` recusa com `OfferQuestionsUnavailableError` —
// nada é publicado.

export interface OfferQuestionAnswer {
  text: string;
  /** ISO 8601. */
  answeredAt: string;
}

export interface OfferQuestion {
  id: string;
  /** Protocolo exibido (ex.: "PER-2026-102"). */
  protocol: string;
  offeringId: string;
  offeringName: string;
  question: string;
  /** ISO 8601. */
  askedAt: string;
  /** null enquanto o seller não respondeu. */
  answer: OfferQuestionAnswer | null;
}

/** O backend ainda não oferece a rota de perguntas públicas. */
export class OfferQuestionsUnavailableError extends Error {
  constructor() {
    super("Offer questions endpoint not available");
    this.name = "OfferQuestionsUnavailableError";
  }
}

export const offerQuestionsService = {
  /** Publica a resposta. Hoje sempre recusa: não há rota no backend. */
  answer: async (
    questionId: string,
    text: string,
  ): Promise<OfferQuestionAnswer> => {
    void questionId;
    void text;
    throw new OfferQuestionsUnavailableError();
  },
};
