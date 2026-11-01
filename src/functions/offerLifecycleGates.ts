import type { ProductOffering } from "@/services/productCatalog.service";
import type { ProfileContext } from "@/services/profileSession.service";

// Níveis de KYC que liberam a publicação (marketplace-api, RN §4 e §6).
const PUBLISH_KYC_LEVELS = new Set(["verified", "complete"]);

/**
 * O que o seller pode fazer no ciclo de vida das ofertas, pelo contexto da
 * sessão de perfil. A marketplace-api confere tudo de novo; aqui só orienta
 * a interface. Sem contexto, nada é bloqueado e vale a resposta da API.
 */
export interface OfferLifecycleGates {
  /** `offer:publish`. */
  canPublish: boolean;
  /** `offer:archive` — pausar, despublicar e arquivar. */
  canArchive: boolean;
  /** KYC `verified` ou `complete`. */
  kycVerified: boolean;
}

export function offerLifecycleGates(
  context: ProfileContext | null,
): OfferLifecycleGates {
  if (!context) {
    return { canPublish: true, canArchive: true, kycVerified: true };
  }
  return {
    canPublish: context.permissions.includes("offer:publish"),
    canArchive: context.permissions.includes("offer:archive"),
    kycVerified: PUBLISH_KYC_LEVELS.has(context.kyc_level),
  };
}

/**
 * Chave de tradução do que falta para publicar a oferta (KYC, cobertura ou,
 * no produto físico, o pacote de envio), ou null quando nada impede. Sem
 * `offer:publish`, a ação nem aparece.
 */
export function publishBlockerKey(
  offering: ProductOffering,
  gates: OfferLifecycleGates,
): string | null {
  if (!gates.kycVerified) return "SellerOffers.errors.kycNotVerified";
  // Produto físico é enviado: publicar exige o pacote de envio, não cobertura.
  if (offering.productType === "physical") {
    return offering.shipping ? null : "SellerOffers.errors.shippingRequired";
  }
  if (!offering.coverageVersionId) {
    return "SellerOffers.errors.coverageRequired";
  }
  return null;
}
