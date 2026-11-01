import type { CartLine } from "@/functions/cartView";

export interface CartItemRowProps {
  line: CartLine;
  /** Posição no carrinho: escolhe o degradê da miniatura. */
  index: number;
  locale: string;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}
