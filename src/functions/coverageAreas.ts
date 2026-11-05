// Áreas do KMZ (`coverageAreaIndexes`): os placemarks com polígono de uma
// versão de cobertura, listados pela geo-api em
// `GET /coverageVersion/{id}/elements`. O seller escolhe quais ficam
// públicas e o `PUT /productOffering/{id}/coverageVersion` leva só os
// índices — a geo-api junta as áreas e recorta pela cobertura.

import {
  geometryAreaKm2,
  isPublicGeometry,
  polygonsOf,
  type PublicGeometry,
} from "@/functions/geoShapes";

/** Teto de áreas por oferta (`area_indexes` da geo-api). */
export const COVERAGE_AREAS_MAX = 500;

/** Área do KMZ que pode ser escolhida (tem polígono). */
export interface CoverageArea {
  /** `placemarkIndex` da versão — o que vai em `coverageAreaIndexes`. */
  index: number;
  /** Nome do placemark; vazio quando o KMZ não tem. */
  name: string;
  /** Pastas do KMZ até o placemark ("Regional Sul / Curitiba"). */
  folder: string;
  geometry: PublicGeometry;
  areaKm2: number;
}

const isAreaIndex = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0;

/**
 * Lista de índices aceita pela geo-api: de 1 a 500 inteiros ≥ 0, sem
 * repetidos.
 */
export function isCoverageAreaIndexList(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.length <= COVERAGE_AREAS_MAX &&
    value.every(isAreaIndex) &&
    new Set(value).size === value.length
  );
}

/** Polígonos de um GeoJSON qualquer como recorte público (ou null). */
export function publicGeometryOf(geometry: unknown): PublicGeometry | null {
  const polygons = polygonsOf(geometry);
  if (!polygons.length) return null;
  const result: PublicGeometry =
    polygons.length === 1
      ? { type: "Polygon", coordinates: polygons[0] }
      : { type: "MultiPolygon", coordinates: polygons };
  return isPublicGeometry(result) ? result : null;
}

/**
 * Item de `/elements` → área escolhível. Pontos e linhas (sem área) ficam de
 * fora: a geo-api recusa esses índices.
 */
export function coverageAreaOf(element: unknown): CoverageArea | null {
  if (!element || typeof element !== "object") return null;
  const item = element as Record<string, unknown>;
  if (!isAreaIndex(item.placemarkIndex)) return null;
  const geometry = publicGeometryOf(item.geometry);
  if (!geometry) return null;
  const folder = Array.isArray(item.folderPath)
    ? item.folderPath.filter((part) => typeof part === "string").join(" / ")
    : "";
  return {
    index: item.placemarkIndex,
    name: typeof item.name === "string" ? item.name.trim() : "",
    folder,
    geometry,
    areaKm2: geometryAreaKm2(geometry),
  };
}

/** Desenho das áreas escolhidas, para o mapa da oferta (prévia). */
export function selectedAreasGeometry(
  areas: CoverageArea[],
  indexes: number[],
): PublicGeometry | null {
  const chosen = new Set(indexes);
  return publicGeometryOf({
    type: "GeometryCollection",
    geometries: areas
      .filter((area) => chosen.has(area.index))
      .map((area) => area.geometry),
  });
}

/**
 * Índices salvos na escolha do seller (`publicSelection.areaIndexes` do
 * `GET /offerCoverage`); null quando a oferta não foi vinculada por áreas.
 */
export function savedAreaIndexesOf(publicSelection: unknown): number[] | null {
  if (!publicSelection || typeof publicSelection !== "object") return null;
  const { areaIndexes } = publicSelection as Record<string, unknown>;
  return isCoverageAreaIndexList(areaIndexes) ? areaIndexes : null;
}
