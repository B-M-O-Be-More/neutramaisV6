import { isUuid } from "@/server/complianceProxy";
import { envelopeError } from "@/server/identityProxy";
import { forwardToOrders } from "@/server/ordersProxy";

// BFF: GET /api/orders/{orderId}/shipping/invoice
//   → orders-api GET /productOrder/{orderId}/shipping/invoice.pdf
// PDF da nota fiscal anexada pelo Seller. 404 enquanto não há NF.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  if (!isUuid(orderId)) {
    return envelopeError(422, "validation_error", "orderId deve ser um UUID.");
  }

  return forwardToOrders({
    path: `/productOrder/${encodeURIComponent(orderId)}/shipping/invoice.pdf`,
    binary: true,
  });
}
