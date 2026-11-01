import type { ProfileContext } from "@/services/profileSession.service";

/** Por que o checkout está bloqueado (chave de `Cart.blocked`). */
export type CheckoutBlockReason =
  | "rejected"
  | "notStarted"
  | "inReview"
  | "suspended"
  | "ineligible";

/**
 * Comprar exige KYC Verificado (ou Completo) e o perfil elegível para
 * transacionar (`transaction_eligible` do contexto Buyer). null = liberado.
 */
export function checkoutBlockReason(
  context: Pick<ProfileContext, "kyc_state" | "transaction_eligible">,
): CheckoutBlockReason | null {
  switch (context.kyc_state) {
    case "rejected":
      return "rejected";
    case "suspended":
      return "suspended";
    case "pending_documents":
    case "under_review":
      return "inReview";
    case "verified":
    case "complete":
      return context.transaction_eligible ? null : "ineligible";
    default:
      return "notStarted";
  }
}
