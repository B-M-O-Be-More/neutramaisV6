import type { SellerComplementValues } from "@/schemas/sellerInbox";

export interface SellerOrderComplementDialogProps {
  /**
   * Linha abaixo do título com o pedido (ex.: "Pedido #E2B7D4A9 · Link
   * Dedicado"); null fecha o modal.
   */
  subtitle: string | null;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: SellerComplementValues) => void;
}
