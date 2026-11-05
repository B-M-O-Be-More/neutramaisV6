import { NextRequest } from "next/server";

import { isUuid, readJsonBody } from "@/server/complianceProxy";
import { envelopeError } from "@/server/identityProxy";
import { forwardToMarketplace, pickBody } from "@/server/marketplaceProxy";

// Campos de `PATCH /productSpecification/{id}`. `characteristics` substitui o
// objeto inteiro.
const UPDATE_FIELDS = [
  "name",
  "categoryId",
  "characteristics",
  "description",
  "estimatedInstallationDays",
  "capacity",
] as const;

// BFF: PATCH /api/productCatalog/productSpecification/{specificationId}
//   → marketplace-api PATCH /productCatalog/productSpecification/{id}
// Edita a especificação; a API revalida `characteristics` com o template
// atual da categoria. Vai com o token do perfil Seller.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ specificationId: string }> },
) {
  const { specificationId } = await params;
  if (!isUuid(specificationId)) {
    return envelopeError(
      422,
      "validation_error",
      "specificationId deve ser um UUID.",
    );
  }

  return forwardToMarketplace({
    method: "PATCH",
    path: `/productCatalog/productSpecification/${specificationId}`,
    body: pickBody(await readJsonBody(request), UPDATE_FIELDS),
    authenticated: true,
    profileSession: true,
  });
}
