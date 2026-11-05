import type { OrderTrackingValues } from "@/schemas/orderShipping";

export type { OrderTrackingValues };

export interface FormOrderTrackingProps {
  /** Código já informado, para trocar. */
  defaultCode?: string;
  isSubmitting: boolean;
  /** Fecha sem enviar. */
  onCancel: () => void;
  onSubmit: (values: OrderTrackingValues) => void;
}
