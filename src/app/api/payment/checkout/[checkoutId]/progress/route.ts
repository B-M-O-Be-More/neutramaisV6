import { isUuid } from "@/server/complianceProxy";
import { envelopeError } from "@/server/identityProxy";
import { forwardToPayment } from "@/server/paymentProxy";

// BFF: GET /api/payment/checkout/{checkoutId}/progress
//   → payment-api GET /payment/checkout/{checkoutId}/progress
// Etapa do pagamento (processando, aguardando o cartão, confirmado…). Só o
// usuário que pagou vê; os outros recebem 404.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ checkoutId: string }> },
) {
  const { checkoutId } = await params;
  if (!isUuid(checkoutId)) {
    return envelopeError(
      422,
      "validation_error",
      "checkoutId deve ser um UUID.",
    );
  }

  return forwardToPayment({
    path: `/payment/checkout/${encodeURIComponent(checkoutId)}/progress`,
  });
}
