import type { RfqDetailsValues } from "@/schemas/proposals";
import type { QuoteCategory } from "@/types/proposals";

export type { RfqDetailsValues };

export interface FormRfqDetailsProps {
  /** Categoria escolhida na etapa anterior. */
  category: QuoteCategory;
  /** Rascunho ao voltar da revisão (ou da RFQ que está sendo refeita). */
  defaultValues: RfqDetailsValues;
  /** "Trocar": volta à escolha de categoria. */
  onChangeCategory: () => void;
  onBack: () => void;
  /** Segue para a revisão com os valores válidos. */
  onSubmit: (values: RfqDetailsValues) => void;
}
