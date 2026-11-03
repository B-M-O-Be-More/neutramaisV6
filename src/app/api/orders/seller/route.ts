import { NextRequest } from "next/server";

import { forwardOrdersList } from "@/server/ordersProxy";

// BFF: GET /api/orders/seller?offset=0&limit=50
//   → orders-api GET /productOrder/seller
// Pedidos em que a organização do token é o Seller, do mais novo ao mais
// antigo. Exige `order:read` no perfil Seller.
export async function GET(request: NextRequest) {
  return forwardOrdersList(
    request.nextUrl.searchParams,
    "/productOrder/seller",
  );
}
