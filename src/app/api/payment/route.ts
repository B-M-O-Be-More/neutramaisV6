import { readJsonBody } from "@/server/complianceProxy";
import { readIdempotencyKey } from "@/server/idempotency";
import { pickBody } from "@/server/marketplaceProxy";
import { forwardToPayment } from "@/server/paymentProxy";

// BFF: POST /api/payment
//   → payment-api POST /payment
// Paga um checkout autorizado pela orders-api: debita a reserva da carteira e
// cria a cobrança do cartão no Stripe. Quando o cartão precisa de ação, a
// resposta traz `clientSecret` para o Stripe.js. Exige `payment:create` e
// `Idempotency-Key`. Campos extras dão 422: só `checkoutId` e `authorization`.
const PAYMENT_FIELDS = ["checkoutId", "authorization"] as const;

export async function POST(request: Request) {
  const idempotency = readIdempotencyKey(request);
  if ("error" in idempotency) return idempotency.error;

  return forwardToPayment({
    method: "POST",
    path: "/payment",
    body: pickBody(await readJsonBody(request), PAYMENT_FIELDS),
    headers: idempotency.headers,
  });
}
