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

const SENDER_FIELDS = [
  "name",
  "company_document",
  "state_register",
  "postal_code",
  "address",
  "number",
  "district",
  "city",
  "state_abbr",
  "phone",
  "email",
  "complement",
  "economic_activity_code",
] as const;

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Só os campos do contrato: a orders-api recusa campos extras (422). */
function pickInvoice(body: JsonObject): JsonObject | null {
  const { pdfBase64, accessKey, valueMinor, sender } = body;
  const { recipientDocument, recipientEmail, recipientPhone } = body;
  if (
    typeof pdfBase64 !== "string" ||
    typeof accessKey !== "string" ||
    typeof valueMinor !== "number" ||
    !isObject(sender) ||
    typeof recipientDocument !== "string" ||
    typeof recipientEmail !== "string" ||
    typeof recipientPhone !== "string"
  ) {
    return null;
  }

  const pickedSender: JsonObject = {};
  for (const field of SENDER_FIELDS) {
    if (sender[field] !== undefined) pickedSender[field] = sender[field];
  }

  return {
    pdfBase64,
    accessKey,
    valueMinor,
    sender: pickedSender,
    recipientDocument,
    recipientEmail,
    recipientPhone,
  };
}

// BFF: POST /api/orders/{orderId}/shipping/invoice
//   → orders-api POST /productOrder/{orderId}/shipping/invoice
// O Seller anexa a NF do pedido físico aceito: PDF em Base64, chave de
// acesso, valor dos produtos, remetente e destinatário (RN-LOG-02). Exige
// `order:accept` no perfil Seller. Dá para trocar a NF até a compra da
// etiqueta começar.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  if (!isUuid(orderId)) {
    return envelopeError(422, "validation_error", "orderId deve ser um UUID.");
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return envelopeError(422, "validation_error", "Corpo JSON inválido.");
  }
  const body = isObject(raw) ? pickInvoice(raw) : null;
  if (!body) {
    return envelopeError(
      422,
      "validation_error",
      "Envie pdfBase64, accessKey, valueMinor, sender e os dados do destinatário.",
    );
  }

  return forwardToOrders({
    method: "POST",
    path: `/productOrder/${encodeURIComponent(orderId)}/shipping/invoice`,
    body,
  });
}
