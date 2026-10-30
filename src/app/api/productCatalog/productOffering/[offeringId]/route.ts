import { NextRequest } from "next/server";

import { isUuid, readJsonBody } from "@/server/complianceProxy";
import { envelopeError } from "@/server/identityProxy";
import { forwardToMarketplace, pickBody } from "@/server/marketplaceProxy";

// Campos editáveis de `PATCH /productOffering/{id}`. `isPublic` (legado) fica
// de fora: o status muda pelas transições (publish, pause...).
const UPDATE_FIELDS = [
  "name",
  "specificationId",
  "monthlyPrice",
  "installationPrice",
  "speed",
  "durationMonths",
  "isCorporate",
  "stateCode",
  "isCapital",
  "metadata",
  // Produto físico: troca o pacote de envio inteiro. `productType` não muda.
  "shipping",
] as const;

const invalidId = () =>
  envelopeError(422, "validation_error", "offeringId deve ser um UUID.");

// BFF: GET /api/productCatalog/productOffering/{offeringId}
//   → marketplace-api GET /productCatalog/productOffering/{id}
// Detalhe de uma oferta da organização do usuário logado (403 de outra
// organização, 404 inexistente).
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ offeringId: string }> },
) {
  const { offeringId } = await params;
  if (!isUuid(offeringId)) return invalidId();

  return forwardToMarketplace({
    method: "GET",
    path: `/productCatalog/productOffering/${offeringId}`,
    authenticated: true,
  });
}

// BFF: PATCH /api/productCatalog/productOffering/{offeringId}
//   → marketplace-api PATCH /productCatalog/productOffering/{id}
// Edita a oferta (campos opcionais). Ofertas arquivadas são só leitura (409).
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ offeringId: string }> },
) {
  const { offeringId } = await params;
  if (!isUuid(offeringId)) return invalidId();

  return forwardToMarketplace({
    method: "PATCH",
    path: `/productCatalog/productOffering/${offeringId}`,
    body: pickBody(await readJsonBody(request), UPDATE_FIELDS),
    authenticated: true,
    // A marketplace-api confere o perfil Seller na edição.
    profileSession: true,
  });
}
