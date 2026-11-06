import { isUuid, readJsonBody } from "@/server/complianceProxy";
import { envelopeError } from "@/server/identityProxy";
import { forwardToMarketplace, pickBody } from "@/server/marketplaceProxy";

// BFF: POST /api/productCatalog/productOffering/{offeringId}/shippingQuote
//   → marketplace-api POST /productCatalog/productOffering/{id}/shippingQuote
// Cota o frete de um produto físico para o CEP do Buyer (RN-LOG-01). A
// cotação é informativa: a orders-api cota de novo no checkout e recusa com
// 409 se o valor mudou. Exige o perfil Buyer (`order:create`).
const QUOTE_FIELDS = ["destinationPostalCode", "quantity"] as const;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ offeringId: string }> },
) {
  const { offeringId } = await params;
  if (!isUuid(offeringId)) {
    return envelopeError(
      422,
      "validation_error",
      "offeringId deve ser um UUID.",
    );
  }

  return forwardToMarketplace({
    method: "POST",
    path: `/productCatalog/productOffering/${offeringId}/shippingQuote`,
    body: pickBody(await readJsonBody(request), QUOTE_FIELDS),
    profileSession: true,
  });
}
