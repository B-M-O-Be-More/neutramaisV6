import type {
  QuestionsFilter,
  QuestionStatusFilter,
} from "@/functions/offerQuestions";

export interface SellerQuestionsFiltersProps {
  value: QuestionsFilter;
  onChange: (value: QuestionsFilter) => void;
  /** Ofertas com perguntas, para o "Filtrar por". */
  offerings: { id: string; name: string }[];
  /** Perguntas por situação; zero = contador oculto. */
  counts: Record<Exclude<QuestionStatusFilter, "all">, number>;
}
