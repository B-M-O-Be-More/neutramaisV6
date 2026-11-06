import { readJsonBody } from "@/server/complianceProxy";
import { readIdempotencyKey } from "@/server/idempotency";
import { pickBody } from "@/server/marketplaceProxy";
import { forwardToOrders } from "@/server/ordersProxy";

// BFF: POST /api/orders/checkout
//   → orders-api POST /productOrder/checkout
// Cria os pedidos do carrinho do Buyer, um por Seller e por lugar (RN-PED-02,
// RN-TEL-01). Exige `order:create`, MFA no token (403 `MFA_REQUIRED`: o front
// faz o step-up e repete) e `Idempotency-Key` — a mesma chave repete a mesma
// compra. Não cobra: o pagamento vem depois (fundingAuthorization + payment).
// A API recusa campos fora do contrato (422), por isso só `items` e
// `walletMinor` seguem.
const CHECKOUT_FIELDS = ["items", "walletMinor"] as const;

export async function POST(request: Request) {
  const idempotency = readIdempotencyKey(request);
  if ("error" in idempotency) return idempotency.error;

  return forwardToOrders({
    method: "POST",
    path: "/productOrder/checkout",
    body: pickBody(await readJsonBody(request), CHECKOUT_FIELDS),
    headers: idempotency.headers,
  });
}
