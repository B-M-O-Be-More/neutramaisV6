import type { DirectProposalValues } from "@/schemas/directProposal";

export type { DirectProposalValues };

export interface FormDirectProposalProps {
  /** Mínimo de portas da oferta. */
  minPorts: number;
  /** Rascunho ao voltar da revisão, ou o pré-preenchido da oferta. */
  defaultValues: Partial<DirectProposalValues>;
  /** Idioma do tamanho dos anexos (ex.: "pt-BR"). */
  locale: string;
  onCancel: () => void;
  /** Valores válidos: segue para a revisão. */
  onSubmit: (values: DirectProposalValues) => void;
}
