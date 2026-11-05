// Estatísticas de uma versão de cobertura a partir da geometria lida do KMZ
// (a geo-api não devolve contagens): polígonos, linhas, pontos e os nomes dos
// placemarks com área ("Regiões cobertas").

export interface CoverageGeometryStats {
  polygons: number;
  lines: number;
  points: number;
  /** Nomes dos placemarks com área, sem repetir, na ordem do arquivo. */
  regions: string[];
}

interface Counts {
  polygons: number;
  lines: number;
  points: number;
}

function countGeometry(geometry: unknown, counts: Counts): void {
  if (!geometry || typeof geometry !== "object") return;
  const { type, coordinates, geometries } = geometry as {
    type?: unknown;
    coordinates?: unknown;
    geometries?: unknown;
  };
  const parts = Array.isArray(coordinates) ? coordinates.length : 0;
  switch (type) {
    case "Polygon":
      counts.polygons += 1;
      break;
    case "MultiPolygon":
      counts.polygons += parts;
      break;
    case "LineString":
      counts.lines += 1;
      break;
    case "MultiLineString":
      counts.lines += parts;
      break;
    case "Point":
      counts.points += 1;
      break;
    case "MultiPoint":
      counts.points += parts;
      break;
    case "GeometryCollection":
      if (Array.isArray(geometries)) {
        for (const part of geometries) countGeometry(part, counts);
      }
      break;
  }
}

/** Contagens e regiões de um GeoJSON (FeatureCollection, Feature ou geometria). */
export function coverageGeometryStats(geojson: unknown): CoverageGeometryStats {
  const total: Counts = { polygons: 0, lines: 0, points: 0 };
  const regions = new Set<string>();
  if (!geojson || typeof geojson !== "object") {
    return { ...total, regions: [] };
  }

  const { type, features } = geojson as { type?: unknown; features?: unknown };
  const items =
    type === "FeatureCollection" && Array.isArray(features)
      ? features
      : type === "Feature"
        ? [geojson]
        : [{ geometry: geojson }];

  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const { geometry, properties } = item as {
      geometry?: unknown;
      properties?: { name?: unknown } | null;
    };
    const counts: Counts = { polygons: 0, lines: 0, points: 0 };
    countGeometry(geometry, counts);
    total.polygons += counts.polygons;
    total.lines += counts.lines;
    total.points += counts.points;

    const name =
      typeof properties?.name === "string" ? properties.name.trim() : "";
    if (counts.polygons && name) regions.add(name);
  }

  return { ...total, regions: [...regions] };
}
