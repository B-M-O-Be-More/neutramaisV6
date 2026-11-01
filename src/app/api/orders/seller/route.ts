import { NextRequest } from "next/server";

import { envelopeError } from "@/server/identityProxy";
import { forwardToOrders } from "@/server/ordersProxy";

// O upstream aceita offset de 0 a 10000 e limit de 1 a 200.
const OFFSET_PATTERN = /^(10000|\d{1,4})$/;
const LIMIT_PATTERN = /^(200|1\d{2}|[1-9]\d?)$/;

// BFF: GET /api/orders/seller?offset=0&limit=50
//   → orders-api GET /productOrder/seller
// Pedidos em que a organização do token é o Seller, do mais novo ao mais
// antigo. Exige `order:read` no perfil Seller.
export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams;
  const offset = search.get("offset");
  const limit = search.get("limit");

  if (
    (offset !== null && !OFFSET_PATTERN.test(offset)) ||
    (limit !== null && !LIMIT_PATTERN.test(limit))
  ) {
    return envelopeError(
      422,
      "validation_error",
      "Use offset de 0 a 10000 e limit de 1 a 200.",
    );
  }

  return forwardToOrders({
    path: "/productOrder/seller",
    params: { offset, limit },
  });
}
