import { NextRequest } from "next/server";

import { isUuid, readJsonBody } from "@/server/complianceProxy";
import { envelopeError } from "@/server/identityProxy";
import { forwardToMarketplace } from "@/server/marketplaceProxy";

// Mesmos limites da marketplace-api (physical_goods.py).
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const invalidId = () =>
  envelopeError(422, "validation_error", "offeringId deve ser um UUID.");

// BFF: GET /api/productCatalog/productOffering/{offeringId}/images
//   → marketplace-api GET /productCatalog/productOffering/{id}/images
// Imagens da oferta (visão do seller): confirmadas e pendentes, com a URL
// (pública ou assinada) só nas confirmadas.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ offeringId: string }> },
) {
  const { offeringId } = await params;
  if (!isUuid(offeringId)) return invalidId();

  return forwardToMarketplace({
    method: "GET",
    path: `/productCatalog/productOffering/${offeringId}/images`,
    authenticated: true,
    profileSession: true,
  });
}

// BFF: POST /api/productCatalog/productOffering/{offeringId}/images
//   → marketplace-api POST /productCatalog/productOffering/{id}/images
// Autoriza o envio de uma imagem e devolve o formulário assinado do storage
// — o browser manda os bytes direto para lá e depois chama `/confirm`.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ offeringId: string }> },
) {
  const { offeringId } = await params;
  if (!isUuid(offeringId)) return invalidId();

  const body = (await readJsonBody(request)) as
    | { contentType?: unknown; sizeBytes?: unknown }
    | undefined;
  const contentType = body?.contentType;
  const sizeBytes = body?.sizeBytes;
  if (
    typeof contentType !== "string" ||
    !IMAGE_TYPES.includes(contentType) ||
    typeof sizeBytes !== "number" ||
    !Number.isInteger(sizeBytes) ||
    sizeBytes < 1 ||
    sizeBytes > MAX_IMAGE_BYTES
  ) {
    return envelopeError(
      422,
      "validation_error",
      "Envie contentType (jpeg, png ou webp) e sizeBytes até 5 MB.",
    );
  }

  return forwardToMarketplace({
    method: "POST",
    path: `/productCatalog/productOffering/${offeringId}/images`,
    body: { contentType, sizeBytes },
    authenticated: true,
    profileSession: true,
  });
}
