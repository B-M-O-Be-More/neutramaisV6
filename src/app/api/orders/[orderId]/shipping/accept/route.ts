import { isUuid } from "@/server/complianceProxy";
import { envelopeError } from "@/server/identityProxy";
import { forwardToOrders } from "@/server/ordersProxy";

// BFF: POST /api/orders/{orderId}/shipping/accept
//   → orders-api POST /productOrder/{orderId}/shipping/accept
// O Seller aceita um pedido físico já pago (RN-LOG-02). Exige `order:accept`
// no perfil Seller. É o único aceite da orders-api: o `/accept` genérico foi
// desativado (409).
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  if (!isUuid(orderId)) {
    return envelopeError(422, "validation_error", "orderId deve ser um UUID.");
  }

  return forwardToOrders({
    method: "POST",
    path: `/productOrder/${encodeURIComponent(orderId)}/shipping/accept`,
  });
}
