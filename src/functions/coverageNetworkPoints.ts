// Pontos de rede da cobertura (`coverageNetworkPoints`): as localidades de
// atendimento (ponto + raio) como vão no
// `PUT /productOffering/{id}/coverageVersion` e voltam no
// `GET /offerCoverage/{id}`.

import { parseDecimal } from "@/functions/parseDecimal";
import {
  OFFER_LOCATION_RADIUS_MAX_KM,
  OFFER_LOCATION_RADIUS_MIN_KM,
  type OfferLocation,
} from "@/schemas/sellerOffer";

/** Localidade de atendimento: ponto [longitude, latitude] e raio em metros. */
export interface CoverageNetworkPoint {
  longitude: number;
  latitude: number;
  radiusMeters: number;
}

const isNumberIn = (value: unknown, min: number, max: number) =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= min &&
  value <= max;

/** Ponto com coordenadas válidas e raio positivo. */
export function isCoverageNetworkPoint(
  value: unknown,
): value is CoverageNetworkPoint {
  if (!value || typeof value !== "object") return false;
  const { longitude, latitude, radiusMeters } = value as Record<
    string,
    unknown
  >;
  return (
    isNumberIn(longitude, -180, 180) &&
    isNumberIn(latitude, -90, 90) &&
    typeof radiusMeters === "number" &&
    Number.isFinite(radiusMeters) &&
    radiusMeters > 0
  );
}

/** Só os pontos válidos de uma lista vinda da API. */
export function coverageNetworkPointsOf(
  value: unknown,
): CoverageNetworkPoint[] {
  return Array.isArray(value) ? value.filter(isCoverageNetworkPoint) : [];
}

/**
 * Localidades do formulário → `coverageNetworkPoints` (raio de km para metros).
 * Linhas sem endereço escolhido ficam de fora; `invalid` avisa quando alguma
 * tem o ponto mas não um raio entre 1 e 80 km.
 */
export function locationsToCoverageNetworkPoints(
  locations: readonly Partial<OfferLocation>[] | undefined,
): { points: CoverageNetworkPoint[]; invalid: boolean } {
  const points: CoverageNetworkPoint[] = [];
  let invalid = false;
  for (const { longitude, latitude, radiusKm } of locations ?? []) {
    if (typeof longitude !== "number" || typeof latitude !== "number") {
      continue;
    }
    const radius = parseDecimal(radiusKm);
    if (
      radius === null ||
      radius < OFFER_LOCATION_RADIUS_MIN_KM ||
      radius > OFFER_LOCATION_RADIUS_MAX_KM
    ) {
      invalid = true;
      continue;
    }
    points.push({
      longitude,
      latitude,
      radiusMeters: Math.round(radius * 1000),
    });
  }
  return { points, invalid };
}

/** "-23.56000, -46.65500" (latitude, longitude), para nomear o ponto. */
export function formatCoordinates(longitude: number, latitude: number): string {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

/**
 * `coverageNetworkPoints` salvos → localidades do formulário. A API não guarda o
 * endereço: o rótulo é a coordenada. O raio vai para km com uma casa, como a
 * máscara do campo ("1,5").
 */
export function coverageNetworkPointsToLocations(
  points: readonly CoverageNetworkPoint[],
): OfferLocation[] {
  return points.map(({ longitude, latitude, radiusMeters }) => ({
    label: formatCoordinates(longitude, latitude),
    longitude,
    latitude,
    radiusKm: (Math.round(radiusMeters / 100) / 10)
      .toString()
      .replace(".", ","),
  }));
}

/**
 * Mesmos pontos, na mesma ordem. O raio tolera o arredondamento do campo
 * (uma casa em km = 100 m): o salvo com 1.234 m e o exibido "1,2" não contam
 * como mudança.
 */
export function sameCoverageNetworkPoints(
  a: readonly CoverageNetworkPoint[],
  b: readonly CoverageNetworkPoint[],
): boolean {
  return (
    a.length === b.length &&
    a.every(
      (point, index) =>
        Math.abs(point.longitude - b[index].longitude) < 1e-9 &&
        Math.abs(point.latitude - b[index].latitude) < 1e-9 &&
        Math.abs(point.radiusMeters - b[index].radiusMeters) <= 50,
    )
  );
}
