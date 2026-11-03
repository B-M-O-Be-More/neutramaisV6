import { isUuid } from "@/server/complianceProxy";
import { envelopeError } from "@/server/identityProxy";
import { forwardToOrders } from "@/server/ordersProxy";

// Mesmo formato que a orders-api aceita: 5 a 64 letras, dígitos ou hífen.
const TRACKING_PATTERN = /^[A-Za-z0-9-]{5,64}$/;

// BFF: POST /api/orders/{orderId}/shipping/tracking
//   → orders-api POST /productOrder/{orderId}/shipping/tracking
// Rastreio manual do pedido físico pago, aceito e com NF (só quando a oferta
// não usa rastreio automático). Exige `order:accept` no perfil Seller.
// Depois dele, o pedido não pode mais ser cancelado pela API.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  if (!isUuid(orderId)) {
    return envelopeError(422, "validation_error", "orderId deve ser um UUID.");
  }

  let code: unknown;
  try {
    ({ code } = (await request.json()) as { code?: unknown });
  } catch {
    return envelopeError(422, "validation_error", "Corpo JSON inválido.");
  }
  if (typeof code !== "string" || !TRACKING_PATTERN.test(code)) {
    return envelopeError(
      422,
      "validation_error",
      "code deve ter de 5 a 64 letras, dígitos ou hífen.",
    );
  }

  return forwardToOrders({
    method: "POST",
    path: `/productOrder/${encodeURIComponent(orderId)}/shipping/tracking`,
    body: { code },
  });
}
