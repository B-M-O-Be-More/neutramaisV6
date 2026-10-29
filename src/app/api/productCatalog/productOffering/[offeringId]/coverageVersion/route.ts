import { NextRequest } from "next/server";

import { isUuid, readJsonBody } from "@/server/complianceProxy";
import { envelopeError } from "@/server/identityProxy";
import { forwardToMarketplace } from "@/server/marketplaceProxy";

// BFF: PUT /api/productCatalog/productOffering/{offeringId}/coverageVersion
//   → marketplace-api PUT /productCatalog/productOffering/{id}/coverageVersion
// Vincula uma versão de cobertura (KMZ) à oferta. Exige `coverage:change`; o
// upstream responde 503 para qualquer falha da geo-api.
// `publicGeometry` (opcional) é o recorte público — Polygon ou MultiPolygon
// dentro da área do KMZ; a geo-api confere se está contido.

/** Teto de vértices aceitos no recorte desenhado. */
const MAX_VERTICES = 2000;

const isPosition = (value: unknown) =>
  Array.isArray(value) &&
  value.length === 2 &&
  value.every((n) => typeof n === "number" && Number.isFinite(n));

/** Anéis fechados com pelo menos 4 posições (GeoJSON). */
const isRings = (value: unknown): value is unknown[][] =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.every(
    (ring) => Array.isArray(ring) && ring.length >= 4 && ring.every(isPosition),
  );

function isPublicGeometry(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const { type, coordinates } = value as Record<string, unknown>;
  const polygons =
    type === "Polygon"
      ? [coordinates]
      : type === "MultiPolygon" && Array.isArray(coordinates)
        ? coordinates
        : null;
  if (!polygons?.length || !polygons.every(isRings)) return false;
  const vertices = (polygons as unknown[][][]).flat().flat().length;
  return vertices <= MAX_VERTICES;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ offeringId: string }> },
) {
  const { offeringId } = await params;
  const body = (await readJsonBody(request)) as
    | { coverageVersionId?: unknown; publicGeometry?: unknown }
    | undefined;
  const coverageVersionId = body?.coverageVersionId;
  const publicGeometry = body?.publicGeometry;

  if (
    !isUuid(offeringId) ||
    typeof coverageVersionId !== "string" ||
    !isUuid(coverageVersionId)
  ) {
    return envelopeError(
      422,
      "validation_error",
      "offeringId e coverageVersionId devem ser UUIDs.",
    );
  }
  if (publicGeometry != null && !isPublicGeometry(publicGeometry)) {
    return envelopeError(
      422,
      "validation_error",
      "publicGeometry deve ser um Polygon ou MultiPolygon GeoJSON válido.",
    );
  }

  return forwardToMarketplace({
    method: "PUT",
    path: `/productCatalog/productOffering/${offeringId}/coverageVersion`,
    body: publicGeometry
      ? { coverageVersionId, publicGeometry }
      : { coverageVersionId },
    authenticated: true,
  });
}
