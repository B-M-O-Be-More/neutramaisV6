import { isUuid } from "@/server/complianceProxy";
import { envelopeError } from "@/server/identityProxy";
import { forwardToOrders } from "@/server/ordersProxy";

// BFF: GET /api/orders/checkout/{checkoutId}/progress
//   → orders-api GET /productOrder/checkout/{checkoutId}/progress
// Etapa do checkout (aguardando pagamento, aprovação, Seller…) e quando
// consultar de novo (`pollAfterSeconds`).
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

  return forwardToOrders({
    path: `/productOrder/checkout/${encodeURIComponent(checkoutId)}/progress`,
  });
}
