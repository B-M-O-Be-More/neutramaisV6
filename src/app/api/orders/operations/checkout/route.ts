import { readIdempotencyKey } from "@/server/idempotency";
import { forwardToOrders } from "@/server/ordersProxy";

// BFF: GET /api/orders/operations/checkout
//   → orders-api GET /productOrder/operations/checkout
// Progresso do checkout pela `Idempotency-Key` do POST, enquanto o front
// ainda não tem o checkoutId (resposta demorou ou a aba recarregou). 404 quer
// dizer que o checkout ainda não foi gravado: consulte de novo.
export async function GET(request: Request) {
  const idempotency = readIdempotencyKey(request);
  if ("error" in idempotency) return idempotency.error;

  return forwardToOrders({
    path: "/productOrder/operations/checkout",
    headers: idempotency.headers,
  });
}
