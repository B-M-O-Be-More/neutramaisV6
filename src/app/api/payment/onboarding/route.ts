import { NextRequest } from "next/server";

import { readJsonBody } from "@/server/complianceProxy";
import { envelopeError } from "@/server/identityProxy";
import { forwardToPayment } from "@/server/paymentProxy";

// BFF: POST /api/payment/onboarding → payment-api POST /payment/onboarding
// Cria (ou reabre) a conta Stripe Connect da organização do token e devolve
// o link do formulário do Stripe (`onboardingUrl`, vence em minutos). Só o
// `seller_owner` com token `mfa: true`: 403 `seller_owner_required` ou
// `mfa_required` na raiz do corpo. 400 quando a conta já está ativa.
export async function POST(request: NextRequest) {
  const body = (await readJsonBody(request)) as { email?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  if (!email) {
    return envelopeError(422, "validation_error", "email é obrigatório.");
  }

  // Só o campo do contrato segue para a payment-api.
  return forwardToPayment({
    method: "POST",
    path: "/payment/onboarding",
    body: { email },
  });
}
