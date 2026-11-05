import { NextRequest } from "next/server";

import { isUuid, readJsonBody } from "@/server/complianceProxy";
import { envelopeError } from "@/server/identityProxy";
import { forwardToMarketplace, pickBody } from "@/server/marketplaceProxy";

// Campos de `POST /price` (extras viram 422 no upstream).
const CREATE_FIELDS = [
  "priceType",
  "currency",
  "amount",
  "recurringPeriod",
  "minQuantity",
  "maxQuantity",
] as const;

const invalidId = () =>
  envelopeError(422, "validation_error", "offeringId deve ser um UUID.");

// BFF: GET /api/productCatalog/productOffering/{offeringId}/price[?history=true]
//   → marketplace-api GET /productCatalog/productOffering/{id}/price
// Preços ativos da oferta (por tipo e faixa); com `history=true`, também os
// encerrados, do mais novo para o mais antigo.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ offeringId: string }> },
) {
  const { offeringId } = await params;
  if (!isUuid(offeringId)) return invalidId();

  return forwardToMarketplace({
    method: "GET",
    path: `/productCatalog/productOffering/${offeringId}/price`,
    params: {
      history:
        request.nextUrl.searchParams.get("history") === "true"
          ? "true"
          : undefined,
    },
    authenticated: true,
    profileSession: true,
  });
}

// BFF: POST /api/productCatalog/productOffering/{offeringId}/price
//   → marketplace-api POST /productCatalog/productOffering/{id}/price
// Adiciona um preço (faixa de quantidade, à vista ou taxa única). Exige
// `price:change`; 422 `MKT_PRICE_TIER_OVERLAP`, `MKT_OFFER_CURRENCY_MISMATCH`
// e `MKT_PRICE_INVALID` quando o conjunto de preços ativos não fecha.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ offeringId: string }> },
) {
  const { offeringId } = await params;
  if (!isUuid(offeringId)) return invalidId();

  return forwardToMarketplace({
    method: "POST",
    path: `/productCatalog/productOffering/${offeringId}/price`,
    body: pickBody(await readJsonBody(request), CREATE_FIELDS),
    authenticated: true,
    profileSession: true,
  });
}
