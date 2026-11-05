import { NextRequest } from "next/server";

import { forwardOrdersList } from "@/server/ordersProxy";

// BFF: GET /api/orders/buyer?offset=0&limit=50
//   → orders-api GET /productOrder/buyer
// Pedidos em que a organização do token é o Buyer, do mais novo ao mais
// antigo. Exige `order:read` no perfil Buyer.
export async function GET(request: NextRequest) {
  return forwardOrdersList(request.nextUrl.searchParams, "/productOrder/buyer");
}
