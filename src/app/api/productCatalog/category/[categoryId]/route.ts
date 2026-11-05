import { isUuid } from "@/server/complianceProxy";
import { envelopeError } from "@/server/identityProxy";
import { forwardToMarketplace } from "@/server/marketplaceProxy";

// BFF: GET /api/productCatalog/category/{categoryId}
//   → marketplace-api GET /productCatalog/category/{id}
// Categoria com o template efetivo (campos herdados primeiro) e as regras
// condicionais. Para Seller e Buyer a regra vem só com key, name,
// description, required e valueFields.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ categoryId: string }> },
) {
  const { categoryId } = await params;
  if (!isUuid(categoryId)) {
    return envelopeError(422, "validation_error", "categoryId deve ser um UUID.");
  }

  return forwardToMarketplace({
    method: "GET",
    path: `/productCatalog/category/${categoryId}`,
    authenticated: true,
    profileSession: true,
  });
}
