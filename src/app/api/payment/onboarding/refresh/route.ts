import { forwardToPayment } from "@/server/paymentProxy";

// BFF: POST /api/payment/onboarding/refresh
//   → payment-api POST /payment/onboarding/refresh
// Lê no Stripe a situação da conta da organização do token e grava. Chamada
// quando o Seller volta do formulário do Stripe. Mesmas travas do onboarding
// (`seller_owner`, `mfa: true`); 404 sem onboarding iniciado.
export async function POST() {
  return forwardToPayment({
    method: "POST",
    path: "/payment/onboarding/refresh",
  });
}
