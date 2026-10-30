import { NextRequest } from "next/server";

import { isPublicGeometry, vertexCount } from "@/functions/geoShapes";
import { isCoverageNetworkPoint } from "@/functions/coverageNetworkPoints";
import { isUuid, readJsonBody } from "@/server/complianceProxy";
import { envelopeError } from "@/server/identityProxy";
import { forwardToMarketplace } from "@/server/marketplaceProxy";

// BFF: PUT /api/productCatalog/productOffering/{offeringId}/coverageVersion
//   → marketplace-api PUT /productCatalog/productOffering/{id}/coverageVersion
// Vincula uma versão de cobertura (KMZ) à oferta. Exige `coverage:change`; o
// upstream responde 503 para qualquer falha da geo-api.
// `publicGeometry` é o recorte público, dentro da área do KMZ (a geo-api
// confere se está contido):
// - ausente ou null: vale o KMZ inteiro;
// - Polygon: uma área;
// - MultiPolygon: várias áreas, um polígono por área.
// Cada anel fecha: o último ponto repete o primeiro.
// `coverageNetworkPoints` são as localidades de atendimento, cada uma com o raio:
//   [{ longitude, latitude, radiusMeters }]
// - ausente: o upstream decide (não mexe nos pontos salvos);
// - []: a oferta fica sem localidades.

/** Teto de vértices aceitos no recorte desenhado. */
const MAX_VERTICES = 2000;
/** Teto de pontos e de raio: o que o formulário da oferta permite. */
const MAX_POINTS = 10;
const MAX_RADIUS_METERS = 80_000;

const isDrawnGeometry = (value: unknown) =>
  isPublicGeometry(value) && vertexCount(value) <= MAX_VERTICES;

const isPointList = (value: unknown) =>
  Array.isArray(value) &&
  value.length <= MAX_POINTS &&
  value.every(
    (point) =>
      isCoverageNetworkPoint(point) && point.radiusMeters <= MAX_RADIUS_METERS,
  );

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ offeringId: string }> },
) {
  const { offeringId } = await params;
  const body = (await readJsonBody(request)) as
    | {
        coverageVersionId?: unknown;
        publicGeometry?: unknown;
        coverageNetworkPoints?: unknown;
      }
    | undefined;
  const coverageVersionId = body?.coverageVersionId;
  const publicGeometry = body?.publicGeometry;
  const coverageNetworkPoints = body?.coverageNetworkPoints;

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
  if (publicGeometry != null && !isDrawnGeometry(publicGeometry)) {
    return envelopeError(
      422,
      "validation_error",
      "publicGeometry deve ser um Polygon ou MultiPolygon GeoJSON válido.",
    );
  }
  if (
    coverageNetworkPoints !== undefined &&
    !isPointList(coverageNetworkPoints)
  ) {
    return envelopeError(
      422,
      "validation_error",
      "coverageNetworkPoints deve ter até 10 pontos { longitude, latitude, radiusMeters } com raio de até 80 km.",
    );
  }

  return forwardToMarketplace({
    method: "PUT",
    path: `/productCatalog/productOffering/${offeringId}/coverageVersion`,
    body: {
      coverageVersionId,
      ...(publicGeometry ? { publicGeometry } : {}),
      ...(coverageNetworkPoints !== undefined ? { coverageNetworkPoints } : {}),
    },
    authenticated: true,
    profileSession: true,
  });
}
