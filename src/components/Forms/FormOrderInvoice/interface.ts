import type { OrderInvoiceValues } from "@/schemas/orderShipping";
import type { AttachInvoiceInput } from "@/services/orders.service";

export type { OrderInvoiceValues };

export interface FormOrderInvoiceProps {
  /**
   * Valores que o pedido e a sessão já trazem: valor dos produtos, CEP de
   * origem, e-mail e endereço da organização.
   */
  defaultValues?: Partial<Omit<OrderInvoiceValues, "file">>;
  isSubmitting: boolean;
  /** Fecha sem enviar. */
  onCancel: () => void;
  /** Recebe o corpo pronto para a orders-api (PDF em Base64). */
  onSubmit: (input: AttachInvoiceInput) => void;
}
