import type { ContractAmendmentValues } from "@/schemas/contracts";

export type { ContractAmendmentValues };

export interface FormContractAmendmentProps {
  /** Prefixo dos ids do campo (único na página). */
  id: string;
  /** `inline`: dentro do card da lista. `section`: no detail do contrato. */
  variant: "inline" | "section";
  isSubmitting: boolean;
  onSubmit: (values: ContractAmendmentValues) => void;
  /** Fecha o formulário sem enviar. */
  onCancel: () => void;
}
