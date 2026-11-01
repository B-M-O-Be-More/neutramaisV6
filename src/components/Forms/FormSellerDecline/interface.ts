import type { SellerDeclineValues } from "@/schemas/sellerInbox";

export type { SellerDeclineValues };

export interface FormSellerDeclineProps {
  /** Prefixo dos `id` dos campos (único na página, ex.: id do pedido). */
  id: string;
  /** "Motivo da recusa (obrigatório · auditável)". */
  title: string;
  placeholder: string;
  /** "Confirmar recusa". */
  confirmLabel: string;
  isSubmitting: boolean;
  /** Fecha o painel sem recusar. */
  onCancel: () => void;
  onSubmit: (values: SellerDeclineValues) => void;
}
