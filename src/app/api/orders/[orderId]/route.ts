import { isUuid } from "@/server/complianceProxy";
import { envelopeError } from "@/server/identityProxy";
import { forwardToOrders } from "@/server/ordersProxy";

// BFF: GET /api/orders/{orderId} → orders-api GET /productOrder/{orderId}
// Pedido do checkout ou antigo, lido pelo Buyer ou pelo Seller do pedido
// (o perfil da sessão). 403 de outra organização; 404 inexistente.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  if (!isUuid(orderId)) {
    return envelopeError(422, "validation_error", "orderId deve ser um UUID.");
  }

  return forwardToOrders({
    path: `/productOrder/${encodeURIComponent(orderId)}`,
  });
}
