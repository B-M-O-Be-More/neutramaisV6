import { isUuid } from "@/server/complianceProxy";
import { envelopeError } from "@/server/identityProxy";
import { forwardToOrders } from "@/server/ordersProxy";

// BFF: POST /api/orders/checkout/{checkoutId}/fundingAuthorization
//   → orders-api POST /productOrder/checkout/{checkoutId}/fundingAuthorization
// Reserva o saldo da carteira e devolve o comando assinado (JWT, 5 min) que a
// payment-api exige para cobrar. Exige MFA (403 `MFA_REQUIRED`). Repetir
// devolve a mesma autorização com um token novo.
export async function POST(
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

  return forwardToOrders({
    method: "POST",
    path: `/productOrder/checkout/${encodeURIComponent(checkoutId)}/fundingAuthorization`,
  });
}
