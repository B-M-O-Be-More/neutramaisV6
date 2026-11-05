import type { ProposalRevisionValues } from "@/schemas/proposals";
import type { ProposalCurrency } from "@/types/proposals";

export type { ProposalRevisionValues };

export interface FormProposalRevisionProps {
  /** Moeda da proposta — fixa na revisão. */
  currency: ProposalCurrency;
  /** Versão que a revisão vai gerar (v2, v3...). */
  nextVersion: number;
  /** Condições atuais ou o rascunho ao voltar da confirmação. */
  defaultValues: ProposalRevisionValues;
  /** Segue para a confirmação com os valores válidos. */
  onSubmit: (values: ProposalRevisionValues) => void;
  onBack: () => void;
}
