import type {
  OfferQuestion,
  OfferQuestionAnswer,
} from "@/services/offerQuestions.service";

export interface SellerQuestionsProps {
  /** Perguntas das ofertas do seller, mais recente primeiro. */
  questions: OfferQuestion[];
  /** Idioma das datas e números (ex.: "pt-BR"). */
  locale: string;
  /** Publicação da resposta; padrão: `offerQuestionsService.answer`. */
  answer?: (questionId: string, text: string) => Promise<OfferQuestionAnswer>;
}
