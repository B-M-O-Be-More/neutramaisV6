import { isUuid } from "@/server/complianceProxy";
import { envelopeError } from "@/server/identityProxy";
import { forwardToOrders } from "@/server/ordersProxy";

// BFF: GET /api/orders/{orderId}/shipping/labels/{labelId}
//   → orders-api GET /productOrder/{orderId}/shipping/labels/{labelId}.pdf
// PDF da etiqueta, lido na hora do Melhor Envio. Só etiqueta `ready`; a
// resposta não vai para cache. Exige `order:accept` no perfil Seller.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string; labelId: string }> },
) {
  const { orderId, labelId } = await params;
  if (!isUuid(orderId) || !isUuid(labelId)) {
    return envelopeError(
      422,
      "validation_error",
      "orderId e labelId devem ser UUIDs.",
    );
  }

  return forwardToOrders({
    path: `/productOrder/${encodeURIComponent(orderId)}/shipping/labels/${encodeURIComponent(labelId)}.pdf`,
    binary: true,
  });
}
