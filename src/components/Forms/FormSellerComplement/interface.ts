import type { SellerComplementValues } from "@/schemas/sellerInbox";

export type { SellerComplementValues };

export interface FormSellerComplementProps {
  isSubmitting: boolean;
  /** Fecha sem enviar. */
  onCancel: () => void;
  onSubmit: (values: SellerComplementValues) => void;
}
