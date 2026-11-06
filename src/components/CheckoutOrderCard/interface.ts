import type { CartLine } from "@/functions/cartView";
import type { QuoteState } from "@/hooks/useCheckoutFlow";
import type { ShippingOption } from "@/services/checkout.service";

export interface CheckoutOrderCardProps {
  /** Posição do pedido (1-based) e total de pedidos do checkout. */
  index: number;
  total: number;
  sellerLabel: string;
  lines: CartLine[];
  quotes: Record<string, QuoteState | undefined>;
  shipping: Record<string, ShippingOption | undefined>;
  /** O CEP de entrega ainda não é válido: sem cotação. */
  awaitingPostalCode: boolean;
  onSelectShipping: (offeringId: string, option: ShippingOption) => void;
  /** Centavos na moeda do checkout → texto. */
  formatMinor: (minor: number) => string;
}
