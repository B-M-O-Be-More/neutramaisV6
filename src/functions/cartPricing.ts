import { CART_MAX_QUANTITY } from "@/functions/cartStorage";
import type {
  CheckoutSnapshot,
  SnapshotPrice,
} from "@/services/checkoutSnapshot.service";

/** Decimal em texto ("2490.00") para centavos, sem erro de ponto flutuante. */
export function decimalToMinor(amount: string): number {
  const [whole, fraction = ""] = amount.trim().split(".");
  const sign = whole.startsWith("-") ? -1 : 1;
  const cents = Number(`${fraction}00`.slice(0, 2));
  return sign * (Math.abs(Number(whole)) * 100 + cents);
}

export interface CartLinePrice {
  /** Total da linha em centavos: cada tipo de preço × quantidade. */
  totalMinor: number;
  /** Preço unitário de cada tipo, na faixa da quantidade. */
  parts: { price: SnapshotPrice; unitMinor: number }[];
}

/**
 * Preço da linha como o checkout cobra (NEU-611): para cada tipo de preço, a
 * faixa que cobre a quantidade, vezes a quantidade (recorrente = primeiro
 * período). null quando algum tipo não tem faixa para a quantidade.
 */
export function cartLinePrice(
  snapshot: CheckoutSnapshot,
  quantity: number,
): CartLinePrice | null {
  const types = [...new Set(snapshot.prices.map((price) => price.priceType))];
  if (types.length === 0) return null;

  const parts: CartLinePrice["parts"] = [];
  for (const type of types) {
    const price = snapshot.prices.find(
      (candidate) =>
        candidate.priceType === type &&
        candidate.minQuantity <= quantity &&
        (candidate.maxQuantity === null || quantity <= candidate.maxQuantity),
    );
    if (!price) return null;
    parts.push({ price, unitMinor: decimalToMinor(price.amount) });
  }

  return {
    totalMinor: parts.reduce((sum, part) => sum + part.unitMinor * quantity, 0),
    parts,
  };
}

/** Quantidade máxima: o teto do checkout, o estoque e o limite por conta. */
export function cartMaxQuantity(snapshot: CheckoutSnapshot): number {
  return Math.min(
    CART_MAX_QUANTITY,
    snapshot.stockQuantity ?? CART_MAX_QUANTITY,
    snapshot.purchaseLimitPerAccount ?? CART_MAX_QUANTITY,
  );
}
