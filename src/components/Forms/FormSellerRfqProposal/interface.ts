import type { SellerRfqProposalValues } from "@/schemas/sellerInbox";

export type { SellerRfqProposalValues };

export interface FormSellerRfqProposalProps {
  /** Prefixo dos `id` dos campos (único na página, ex.: id da RFQ). */
  id: string;
  /** Proposta atual ao atualizar; vazio na primeira. */
  defaultValues: Partial<SellerRfqProposalValues>;
  isSubmitting: boolean;
  /** Fecha o formulário sem enviar. */
  onClose: () => void;
  onSubmit: (values: SellerRfqProposalValues) => void;
}
