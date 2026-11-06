import { isUuid } from "@/server/complianceProxy";
import { envelopeError } from "@/server/identityProxy";
import { forwardToMarketplace } from "@/server/marketplaceProxy";

// BFF: GET /api/productCatalog/productOffering/{offeringId}/checkoutSnapshot
//   → marketplace-api GET /productCatalog/productOffering/{id}/checkoutSnapshot?schemaVersion=3
// Oferta como o checkout a vê: preços por faixa, moeda, tipo, estoque e o
// `snapshotVersion` que o pedido confere. Exige `org:read_self` (perfil
// Buyer). 403 na própria oferta (sem autocompra); 404 fora de venda.
export async function GET(
  _request: Request,
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
    method: "GET",
    path: `/productCatalog/productOffering/${offeringId}/checkoutSnapshot`,
    params: { schemaVersion: 3 },
    profileSession: true,
  });
}
