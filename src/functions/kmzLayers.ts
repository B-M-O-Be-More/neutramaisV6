import type { GeoJSONSource, Map as MapboxMap } from "mapbox-gl";

/** Cores do KMZ no mapa, por tipo de geometria. */
export const KMZ_COLORS = {
  area: "#CC0000",
  line: "#F97316",
  point: "#22C55E",
} as const;

export type KmzGeometryKind = keyof typeof KMZ_COLORS;

const KIND_BY_TYPE: Record<string, KmzGeometryKind> = {
  Polygon: "area",
  MultiPolygon: "area",
  LineString: "line",
  MultiLineString: "line",
  Point: "point",
  MultiPoint: "point",
};

/** Acima deste zoom os pontos aparecem sempre soltos. */
export const KMZ_CLUSTER_MAX_ZOOM = 14;

// Mapbox devolve o tipo simples para Multi*; o `match` cobre as duas formas.
const isType = (...types: string[]) =>
  ["match", ["geometry-type"], types, true, false] as never;

const pointsSourceOf = (sourceId: string) => `${sourceId}-points`;

interface GeoJsonGeometry {
  type: string;
  coordinates?: unknown;
  geometries?: GeoJsonGeometry[];
}

interface GeoJsonFeature {
  type: "Feature";
  properties?: Record<string, unknown> | null;
  geometry: GeoJsonGeometry | null;
}

interface FeatureCollection {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
}

const EMPTY: FeatureCollection = { type: "FeatureCollection", features: [] };

/**
 * Separa os pontos (Point, MultiPoint, também dentro de GeometryCollection)
 * do resto: o cluster do Mapbox só agrupa `Point`, e numa fonte com cluster
 * as linhas e manchas somem.
 */
export function splitKmzPoints(geometry: unknown): {
  shapes: FeatureCollection;
  points: FeatureCollection;
} {
  const collection = geometry as Partial<FeatureCollection> | null;
  if (collection?.type !== "FeatureCollection" || !collection.features) {
    return { shapes: EMPTY, points: EMPTY };
  }

  const shapes: GeoJsonFeature[] = [];
  const points: GeoJsonFeature[] = [];

  for (const feature of collection.features) {
    const properties = feature.properties ?? {};
    const point = (coordinates: unknown) =>
      points.push({
        type: "Feature",
        properties,
        geometry: { type: "Point", coordinates },
      });
    // Devolve a geometria sem os pontos (null se só tinha pontos).
    const withoutPoints = (
      part: GeoJsonGeometry | null,
    ): GeoJsonGeometry | null => {
      if (!part) return null;
      if (part.type === "Point") {
        point(part.coordinates);
        return null;
      }
      if (part.type === "MultiPoint") {
        (part.coordinates as unknown[]).forEach(point);
        return null;
      }
      if (part.type !== "GeometryCollection") return part;
      const rest = (part.geometries ?? [])
        .map(withoutPoints)
        .filter((item): item is GeoJsonGeometry => item !== null);
      if (!rest.length) return null;
      return rest.length === 1
        ? rest[0]
        : { type: "GeometryCollection", geometries: rest };
    };

    const shape = withoutPoints(feature.geometry);
    if (shape === feature.geometry) shapes.push(feature);
    else if (shape) shapes.push({ ...feature, geometry: shape });
  }

  return {
    shapes: { type: "FeatureCollection", features: shapes },
    points: { type: "FeatureCollection", features: points },
  };
}

/**
 * Fontes e camadas do KMZ: manchas em vermelho e linhas em laranja na fonte
 * `sourceId`; pontos em verde em `${sourceId}-points`, agrupados conforme o
 * zoom (o círculo mostra quantos pontos há ali). Com `expandOnClick`, clicar
 * num grupo aproxima até ele se abrir.
 */
export function addKmzLayers(
  map: MapboxMap,
  sourceId: string,
  { expandOnClick = false }: { expandOnClick?: boolean } = {},
) {
  const pointsId = pointsSourceOf(sourceId);

  map.addSource(sourceId, { type: "geojson", data: EMPTY as never });
  map.addSource(pointsId, {
    type: "geojson",
    data: EMPTY as never,
    cluster: true,
    clusterRadius: 50,
    clusterMaxZoom: KMZ_CLUSTER_MAX_ZOOM,
  });

  map.addLayer({
    id: `${sourceId}-fill`,
    type: "fill",
    source: sourceId,
    filter: isType("Polygon", "MultiPolygon"),
    paint: { "fill-color": KMZ_COLORS.area, "fill-opacity": 0.3 },
  });
  map.addLayer({
    id: `${sourceId}-outline`,
    type: "line",
    source: sourceId,
    filter: isType("Polygon", "MultiPolygon"),
    paint: { "line-color": KMZ_COLORS.area, "line-width": 2 },
  });
  map.addLayer({
    id: `${sourceId}-line`,
    type: "line",
    source: sourceId,
    filter: isType("LineString", "MultiLineString"),
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": KMZ_COLORS.line, "line-width": 2.5 },
  });

  // Grupos: o círculo cresce com a quantidade de pontos.
  map.addLayer({
    id: `${sourceId}-cluster`,
    type: "circle",
    source: pointsId,
    filter: ["has", "point_count"],
    paint: {
      "circle-color": KMZ_COLORS.point,
      "circle-opacity": 0.85,
      "circle-radius": [
        "step",
        ["get", "point_count"],
        12,
        10,
        16,
        100,
        20,
        1000,
        26,
      ],
      "circle-stroke-color": "#FFFFFF",
      "circle-stroke-width": 1.5,
    },
  });
  map.addLayer({
    id: `${sourceId}-cluster-count`,
    type: "symbol",
    source: pointsId,
    filter: ["has", "point_count"],
    layout: {
      "text-field": ["get", "point_count_abbreviated"],
      "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
      "text-size": 11,
      "text-allow-overlap": true,
    },
    paint: { "text-color": "#FFFFFF" },
  });
  map.addLayer({
    id: `${sourceId}-point`,
    type: "circle",
    source: pointsId,
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-radius": 5,
      "circle-color": KMZ_COLORS.point,
      "circle-stroke-color": "#FFFFFF",
      "circle-stroke-width": 1.5,
    },
  });

  if (!expandOnClick) return;
  const clusterLayer = `${sourceId}-cluster`;
  map.on("click", clusterLayer, (event) => {
    const [cluster] = (event.features ?? []) as unknown as {
      properties?: { cluster_id?: number } | null;
      geometry?: { type: string; coordinates?: unknown };
    }[];
    const clusterId = cluster?.properties?.cluster_id;
    const source = map.getSource(pointsId) as GeoJSONSource | undefined;
    if (
      clusterId === undefined ||
      !source ||
      cluster.geometry?.type !== "Point"
    )
      return;
    const center = cluster.geometry.coordinates as [number, number];
    source.getClusterExpansionZoom(clusterId, (error, zoom) => {
      if (!error && zoom !== null && zoom !== undefined) {
        map.easeTo({ center, zoom });
      }
    });
  });
  map.on("mouseenter", clusterLayer, () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", clusterLayer, () => {
    map.getCanvas().style.cursor = "";
  });
}

/** Troca o KMZ desenhado nas fontes de `addKmzLayers`. */
export function setKmzData(
  map: MapboxMap,
  sourceId: string,
  geometry: unknown,
) {
  const { shapes, points } = splitKmzPoints(geometry);
  (map.getSource(sourceId) as GeoJSONSource | undefined)?.setData(
    shapes as never,
  );
  (
    map.getSource(pointsSourceOf(sourceId)) as GeoJSONSource | undefined
  )?.setData(points as never);
}

/** Tipos de geometria presentes no GeoJSON do KMZ (para a legenda). */
export function kmzGeometryKinds(node: unknown): Set<KmzGeometryKind> {
  const kinds = new Set<KmzGeometryKind>();
  const walk = (value: unknown): void => {
    if (!value || typeof value !== "object") return;
    const object = value as Record<string, unknown>;
    const kind = KIND_BY_TYPE[object.type as string];
    if (kind) kinds.add(kind);
    if (object.geometry) walk(object.geometry);
    if (Array.isArray(object.features)) object.features.forEach(walk);
    if (Array.isArray(object.geometries)) object.geometries.forEach(walk);
  };
  walk(node);
  return kinds;
}
