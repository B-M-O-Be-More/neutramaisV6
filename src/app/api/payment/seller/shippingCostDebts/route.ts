import { NextRequest } from "next/server";

import { envelopeError } from "@/server/identityProxy";
import { forwardToPayment } from "@/server/paymentProxy";

// O upstream aceita de 1 a 1000 itens; não há cursor nem offset.
const LIMIT_PATTERN = /^(1000|[1-9]\d{0,2})$/;

// BFF: GET /api/payment/seller/shippingCostDebts?limit=1000
//   → payment-api GET /payment/seller/shippingCostDebts
// Dívidas de frete da organização Seller do token (ajuste de custo de envio
// informado pelo Orders), em centavos. Não saem do repasse automaticamente.
// Exige `payment:read` (403 sem ela).
export async function GET(request: NextRequest) {
  const limit = request.nextUrl.searchParams.get("limit");

  if (limit !== null && !LIMIT_PATTERN.test(limit)) {
    return envelopeError(
      422,
      "validation_error",
      "limit deve ser um número de 1 a 1000.",
    );
  }

  return forwardToPayment({
    path: "/payment/seller/shippingCostDebts",
    params: { limit },
  });
}
