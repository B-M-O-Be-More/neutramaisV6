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
  // Moeda dos preços (troca exige reenviar os preços: price:change).
  "currency",
  "speed",
  "durationMonths",
  "isCorporate",
  "stateCode",
  "isCapital",
  "metadata",
  // Estoque: obrigatório para publicar em categoria com estoque numérico.
  "stockQuantity",
  // SLA de aceite (obrigatório para publicar) e cancelamento, públicos.
  "acceptanceSlaHours",
  "cancellationTerms",
  // Produto físico: troca o pacote de envio inteiro. `productType` não muda.
  "shipping",
  // Valores das regras condicionais do template; `{regra: null}` desliga
  // uma regra opcional.
  "ruleValues",
] as const;

const invalidId = () =>
  envelopeError(422, "validation_error", "offeringId deve ser um UUID.");

// BFF: GET /api/productCatalog/productOffering/{offeringId}
//   → marketplace-api GET /productCatalog/productOffering/{id}
// Detalhe de uma oferta da organização do usuário logado (403 de outra
// organização, 404 inexistente). Só nas telas do seller: vai com o token do
// perfil Seller, que se renova sozinho.
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
    profileSession: true,
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
