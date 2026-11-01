import { NextRequest } from "next/server";

import { envelopeError } from "@/server/identityProxy";
import { forwardToPayment } from "@/server/paymentProxy";

// O upstream aceita de 1 a 1000 itens; não há cursor nem offset.
const LIMIT_PATTERN = /^(1000|[1-9]\d{0,2})$/;

// BFF: GET /api/payment/seller/receivables?limit=1000
//   → payment-api GET /payment/seller/receivables
// Recebíveis da organização Seller do token: um item por pedido pago, com
// bruto, retenção da plataforma e líquido em centavos, se já pode entrar no
// repasse (`eligible`) e o lote em que entrou (`batchId`). Exige
// `payment:read` (403 sem ela).
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
    path: "/payment/seller/receivables",
    params: { limit },
  });
}
