import {
  cartLinePrice,
  cartMaxQuantity,
  type CartLinePrice,
} from "@/functions/cartPricing";
import type { CartEntry } from "@/functions/cartStorage";
import type { CheckoutSnapshot } from "@/services/checkoutSnapshot.service";

/** Snapshot já lido de uma oferta do carrinho (ou o motivo de não ter). */
export interface CartOfferingState {
  status: "loading" | "ready" | "unavailable" | "ownOffer" | "failed";
  snapshot: CheckoutSnapshot | null;
}

/**
 * Por que a linha não pode ir ao checkout:
 * - rfq: oferta sob consulta (não entra no carrinho);
 * - noPrice: nenhuma faixa de preço cobre a quantidade;
 * - overLimit: quantidade acima do estoque ou do limite por conta.
 */
export type CartLineProblem = "rfq" | "noPrice" | "overLimit";

export interface CartLine {
  entry: CartEntry;
  snapshot: CheckoutSnapshot;
  price: CartLinePrice | null;
  maxQuantity: number;
  problem: CartLineProblem | null;
}

export interface CartSellerGroup {
  sellerOrganizationId: string;
  lines: CartLine[];
}

export interface CartView {
  /** Um grupo por seller, na ordem em que o primeiro item entrou. */
  groups: CartSellerGroup[];
  /** Itens sem snapshot: fora de venda, da própria organização ou com falha. */
  unavailable: { entry: CartEntry; status: CartOfferingState["status"] }[];
  isLoading: boolean;
  /** Total das linhas que podem seguir, por moeda (centavos). */
  subtotals: Map<string, number>;
  /** Alguma linha é produto físico (frete calculado no pagamento). */
  hasPhysical: boolean;
  /** Algum item impede o checkout (indisponível ou com problema). */
  hasProblems: boolean;
}

function toLine(entry: CartEntry, snapshot: CheckoutSnapshot): CartLine {
  const maxQuantity = cartMaxQuantity(snapshot);
  const price =
    snapshot.pricingMode === "rfq"
      ? null
      : cartLinePrice(snapshot, entry.quantity);
  const problem: CartLineProblem | null =
    snapshot.pricingMode === "rfq"
      ? "rfq"
      : entry.quantity > maxQuantity
        ? "overLimit"
        : price
          ? null
          : "noPrice";
  return { entry, snapshot, price, maxQuantity, problem };
}

export function buildCartView(
  entries: CartEntry[],
  offerings: Map<string, CartOfferingState>,
): CartView {
  const groups = new Map<string, CartLine[]>();
  const unavailable: CartView["unavailable"] = [];
  const subtotals = new Map<string, number>();
  let isLoading = false;
  let hasPhysical = false;
  let hasProblems = false;

  for (const entry of entries) {
    const offering = offerings.get(entry.offeringId);
    if (!offering || offering.status === "loading") {
      isLoading = true;
      continue;
    }
    if (offering.status !== "ready" || !offering.snapshot) {
      unavailable.push({ entry, status: offering.status });
      hasProblems = true;
      continue;
    }

    const line = toLine(entry, offering.snapshot);
    const seller = line.snapshot.sellerOrganizationId;
    groups.set(seller, [...(groups.get(seller) ?? []), line]);

    if (line.problem || !line.price) {
      hasProblems = true;
      continue;
    }
    const currency = line.snapshot.currency ?? "BRL";
    subtotals.set(
      currency,
      (subtotals.get(currency) ?? 0) + line.price.totalMinor,
    );
    if (line.snapshot.productType === "physical") hasPhysical = true;
  }

  return {
    groups: [...groups].map(([sellerOrganizationId, lines]) => ({
      sellerOrganizationId,
      lines,
    })),
    unavailable,
    isLoading,
    subtotals,
    hasPhysical,
    hasProblems,
  };
}
