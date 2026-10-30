// Utilitários de GeoJSON para os mapas de cobertura: enquadramento e
// "ponto dentro da área". Coordenadas sempre [longitude, latitude].

export type LngLat = [number, number];
export type LngLatBounds = [LngLat, LngLat];

/** Polígono simples (um anel externo), como o desenhado na tela. */
export interface PolygonGeometry {
  type: "Polygon";
  coordinates: LngLat[][];
}

/** Caixa [[oeste, sul], [leste, norte]] de todas as coordenadas dos GeoJSON. */
export function boundsOf(...geometries: unknown[]): LngLatBounds | null {
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;

  const visit = (value: unknown): void => {
    if (!Array.isArray(value)) return;
    if (typeof value[0] === "number" && typeof value[1] === "number") {
      west = Math.min(west, value[0]);
      east = Math.max(east, value[0]);
      south = Math.min(south, value[1]);
      north = Math.max(north, value[1]);
      return;
    }
    value.forEach(visit);
  };

  const walk = (node: unknown): void => {
    if (!node || typeof node !== "object") return;
    const object = node as Record<string, unknown>;
    if ("coordinates" in object) visit(object.coordinates);
    if (Array.isArray(object.features)) object.features.forEach(walk);
    if (Array.isArray(object.geometries)) object.geometries.forEach(walk);
    if (object.geometry) walk(object.geometry);
  };

  geometries.forEach(walk);
  return Number.isFinite(west)
    ? [
        [west, south],
        [east, north],
      ]
    : null;
}

/** Anéis de todos os polígonos do GeoJSON (Polygon, MultiPolygon, coleções). */
function polygonsOf(node: unknown): LngLat[][][] {
  if (!node || typeof node !== "object") return [];
  const object = node as Record<string, unknown>;
  switch (object.type) {
    case "Polygon":
      return [object.coordinates as LngLat[][]];
    case "MultiPolygon":
      return object.coordinates as LngLat[][][];
    case "GeometryCollection":
      return ((object.geometries as unknown[]) ?? []).flatMap(polygonsOf);
    case "Feature":
      return polygonsOf(object.geometry);
    case "FeatureCollection":
      return ((object.features as unknown[]) ?? []).flatMap(polygonsOf);
    default:
      return [];
  }
}

/** Ray casting: o ponto está dentro do anel? */
function inRing([x, y]: LngLat, ring: LngLat[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const crosses =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

/**
 * O ponto está dentro de algum polígono da área (respeitando buracos)?
 * Pontos e linhas do GeoJSON não contam como área.
 */
export function pointInArea(point: LngLat, area: unknown): boolean {
  return polygonsOf(area).some(
    ([outer, ...holes]) =>
      !!outer &&
      inRing(point, outer) &&
      !holes.some((hole) => inRing(point, hole)),
  );
}

/** A área tem algum polígono (para saber se dá para conferir algo)? */
export function hasArea(area: unknown): boolean {
  return polygonsOf(area).length > 0;
}

/**
 * Todos os vértices do polígono caem dentro da área? Aproximação suficiente
 * para avisar o seller antes de enviar — a geo-api confere de fato.
 */
export function polygonWithinArea(
  polygon: PolygonGeometry,
  area: unknown,
): boolean {
  const [ring = []] = polygon.coordinates;
  return ring.every((point) => pointInArea(point, area));
}

/** Fecha o anel: GeoJSON exige que o último ponto repita o primeiro. */
export function closedPolygon(points: LngLat[]): PolygonGeometry {
  return { type: "Polygon", coordinates: [[...points, points[0]]] };
}

/** Vários polígonos simples, como os desenhados na "Cobertura editada". */
export interface MultiPolygonGeometry {
  type: "MultiPolygon";
  coordinates: LngLat[][][];
}

/** Recorte público da oferta: um polígono ou vários. */
export type PublicGeometry = PolygonGeometry | MultiPolygonGeometry;

/**
 * Recorte público a partir das formas desenhadas (vértices sem o ponto que
 * repete o primeiro): Polygon com uma forma, MultiPolygon com mais.
 */
export function toPublicGeometry(shapes: LngLat[][]): PublicGeometry | null {
  if (!shapes.length) return null;
  if (shapes.length === 1) return closedPolygon(shapes[0]);
  return {
    type: "MultiPolygon",
    coordinates: shapes.map((shape) => closedPolygon(shape).coordinates),
  };
}

const isPosition = (value: unknown) =>
  Array.isArray(value) &&
  value.length === 2 &&
  value.every((n) => typeof n === "number" && Number.isFinite(n));

/** Anel fechado com pelo menos 4 posições: o último repete o primeiro. */
function isClosedRing(ring: unknown): boolean {
  if (!Array.isArray(ring) || ring.length < 4 || !ring.every(isPosition)) {
    return false;
  }
  const [firstX, firstY] = ring[0] as number[];
  const [lastX, lastY] = ring[ring.length - 1] as number[];
  return firstX === lastX && firstY === lastY;
}

const isRings = (value: unknown): value is unknown[][] =>
  Array.isArray(value) && value.length > 0 && value.every(isClosedRing);

/**
 * GeoJSON é um recorte público válido: Polygon ou MultiPolygon com anéis
 * fechados de [longitude, latitude].
 */
export function isPublicGeometry(value: unknown): value is PublicGeometry {
  if (!value || typeof value !== "object") return false;
  const { type, coordinates } = value as Record<string, unknown>;
  const polygons =
    type === "Polygon"
      ? [coordinates]
      : type === "MultiPolygon" && Array.isArray(coordinates)
        ? coordinates
        : null;
  return !!polygons?.length && polygons.every(isRings);
}

/** Quantidade de vértices de um recorte público (todos os anéis). */
export function vertexCount(geometry: PublicGeometry): number {
  const polygons =
    geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return polygons.flat().flat().length;
}

/** Formas (vértices sem o ponto de fechamento) de um recorte público. */
export function shapesOf(geometry: PublicGeometry | null): LngLat[][] {
  if (!geometry) return [];
  const polygons =
    geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return polygons.map(([ring = []]) => ring.slice(0, -1));
}

const EARTH_RADIUS_M = 6378137;
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/**
 * Área aproximada (km²) da forma na esfera — mesma fórmula do
 * `@mapbox/geojson-area`; serve para informar o seller.
 */
export function shapeAreaKm2(shape: LngLat[]): number {
  const count = shape.length;
  if (count < 3) return 0;
  let total = 0;
  for (let i = 0; i < count; i += 1) {
    const previous = shape[(i + count - 1) % count];
    const current = shape[i];
    const next = shape[(i + 1) % count];
    total +=
      (toRadians(next[0]) - toRadians(previous[0])) *
      Math.sin(toRadians(current[1]));
  }
  return Math.abs((total * EARTH_RADIUS_M * EARTH_RADIUS_M) / 2) / 1e6;
}

/**
 * Área em km² de todos os polígonos do GeoJSON (Polygon, MultiPolygon,
 * Feature, coleções), descontando os furos. O anel fechado (último ponto
 * repetindo o primeiro) não altera a conta.
 */
export function geometryAreaKm2(geometry: unknown): number {
  return polygonsOf(geometry).reduce(
    (total, [outer = [], ...holes]) =>
      total +
      shapeAreaKm2(outer) -
      holes.reduce((sum, hole) => sum + shapeAreaKm2(hole), 0),
    0,
  );
}

// ---------------------------------------------------------------------------
// Validade do recorte: a geo-api recusa (422 "Public subset must be valid
// polygon") polígono que se cruza e MultiPolygon com partes sobrepostas.
// Conferência no plano lon/lat — basta para as áreas desenhadas na tela.
// ---------------------------------------------------------------------------

/** Lado de `c` em relação à reta `a`→`b`: >0 esquerda, <0 direita, 0 sobre. */
function orientation(a: LngLat, b: LngLat, c: LngLat): number {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function onSegment(a: LngLat, b: LngLat, c: LngLat): boolean {
  return (
    Math.min(a[0], b[0]) <= c[0] &&
    c[0] <= Math.max(a[0], b[0]) &&
    Math.min(a[1], b[1]) <= c[1] &&
    c[1] <= Math.max(a[1], b[1])
  );
}

/** Os segmentos `p1p2` e `q1q2` se tocam ou se cruzam? */
function segmentsIntersect(
  p1: LngLat,
  p2: LngLat,
  q1: LngLat,
  q2: LngLat,
): boolean {
  const d1 = orientation(q1, q2, p1);
  const d2 = orientation(q1, q2, p2);
  const d3 = orientation(p1, p2, q1);
  const d4 = orientation(p1, p2, q2);
  if (
    ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
    ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))
  ) {
    return true;
  }
  return (
    (d1 === 0 && onSegment(q1, q2, p1)) ||
    (d2 === 0 && onSegment(q1, q2, p2)) ||
    (d3 === 0 && onSegment(p1, p2, q1)) ||
    (d4 === 0 && onSegment(p1, p2, q2))
  );
}

/** Lados da forma fechada, do último vértice de volta ao primeiro. */
function edgesOf(shape: LngLat[]): [LngLat, LngLat][] {
  return shape.map((point, index) => [
    point,
    shape[(index + 1) % shape.length],
  ]);
}

/** Área no plano lon/lat (shoelace) — o shapely da geo-api valida assim. */
function planarArea(shape: LngLat[]): number {
  return Math.abs(
    edgesOf(shape).reduce(
      (sum, [[x1, y1], [x2, y2]]) => sum + (x1 * y2 - x2 * y1),
      0,
    ) / 2,
  );
}

/**
 * A forma se cruza (lados não vizinhos se tocam) ou não tem área (pontos
 * alinhados)? Nos dois casos a geo-api a recusa.
 */
export function shapeIsInvalid(shape: LngLat[]): boolean {
  if (shape.length < 3 || planarArea(shape) < 1e-12) return true;
  const edges = edgesOf(shape);
  const count = edges.length;
  for (let i = 0; i < count; i += 1) {
    for (let j = i + 2; j < count; j += 1) {
      // O primeiro e o último lado são vizinhos (dividem o vértice inicial).
      if (i === 0 && j === count - 1) continue;
      if (segmentsIntersect(...edges[i], ...edges[j])) return true;
    }
  }
  return false;
}

/**
 * As formas se sobrepõem ou se tocam (lados que se cruzam ou uma dentro da
 * outra)? Num MultiPolygon as partes precisam ficar separadas.
 */
export function shapesOverlap(a: LngLat[], b: LngLat[]): boolean {
  const edgesA = edgesOf(a);
  const edgesB = edgesOf(b);
  if (
    edgesA.some((edgeA) =>
      edgesB.some((edgeB) => segmentsIntersect(...edgeA, ...edgeB)),
    )
  ) {
    return true;
  }
  return (
    pointInArea(a[0], closedPolygon(b)) || pointInArea(b[0], closedPolygon(a))
  );
}
