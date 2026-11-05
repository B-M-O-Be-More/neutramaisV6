// Leitura em fluxo das geometrias de um KML, aos pedaços de texto. Não monta
// o documento: guarda só Placemark, Point, LineString, Polygon e coordinates
// e descarta o resto — em KMZs reais (GPON, "KMZ Geral") quase todo o KML é
// `<description>` (HTML dos balões), e o arquivo passa de centenas de MB.

export type Position = [number, number];

export type KmlGeometry =
  | { type: "Point"; coordinates: Position }
  | { type: "LineString"; coordinates: Position[] }
  | { type: "Polygon"; coordinates: Position[][] }
  | { type: "GeometryCollection"; geometries: KmlGeometry[] };

export interface KmlFeature {
  type: "Feature";
  properties: { name?: string };
  geometry: KmlGeometry;
}

export interface KmlGeometryResult {
  features: KmlFeature[];
  /** Placemarks com área (Polygon, também dentro de MultiGeometry). */
  regionCount: number;
  /** Total de polígonos, contando as partes de MultiGeometry. */
  polygonCount: number;
  coordinateCount: number;
}

export interface KmlGeometryReader {
  /** Próximo pedaço do texto do KML (qualquer corte serve). */
  push(text: string): void;
  result(): KmlGeometryResult;
}

interface OpenGeometry {
  kind: "Point" | "LineString" | "Polygon";
  coordinates: Position[];
  outer: Position[] | null;
  inner: Position[][];
}

interface OpenPlacemark {
  name?: string;
  geometries: KmlGeometry[];
}

/**
 * "lon,lat[,alt] lon,lat[,alt] ..." → posições 2D. Tolera espaço em volta da
 * vírgula e ignora tuplas inválidas.
 */
export function parseKmlCoordinates(text: string): Position[] {
  const positions: Position[] = [];
  const tuples = text
    .replace(/\s*,\s*/g, ",")
    .trim()
    .split(/\s+/);
  for (const tuple of tuples) {
    const [lng, lat] = tuple.split(",");
    if (!lng || !lat) continue;
    const x = Number(lng);
    const y = Number(lat);
    if (Number.isFinite(x) && Number.isFinite(y)) positions.push([x, y]);
  }
  return positions;
}

function closeRing(ring: Position[]): Position[] {
  const [first] = ring;
  const last = ring[ring.length - 1];
  return first && (first[0] !== last[0] || first[1] !== last[1])
    ? [...ring, first]
    : ring;
}

function toGeometry(open: OpenGeometry): KmlGeometry | null {
  if (open.kind === "Point") {
    const [position] = open.coordinates;
    return position ? { type: "Point", coordinates: position } : null;
  }
  if (open.kind === "LineString") {
    return open.coordinates.length >= 2
      ? { type: "LineString", coordinates: open.coordinates }
      : null;
  }
  const outer = open.outer && closeRing(open.outer);
  if (!outer || outer.length < 4) return null;
  return {
    type: "Polygon",
    coordinates: [
      outer,
      ...open.inner.map(closeRing).filter((ring) => ring.length >= 4),
    ],
  };
}

export function createKmlGeometryReader(): KmlGeometryReader {
  const features: KmlFeature[] = [];
  let regionCount = 0;
  let polygonCount = 0;
  let coordinateCount = 0;

  let buffer = "";
  // Fim do trecho que está sendo pulado (comentário, CDATA, <description>).
  let skipUntil: string | null = null;
  // Texto sendo guardado: o nome do Placemark ou as coordenadas.
  let capture: "name" | "coordinates" | null = null;
  let captured: string[] = [];

  let placemark: OpenPlacemark | null = null;
  let geometry: OpenGeometry | null = null;
  let boundary: "outer" | "inner" | null = null;

  const takeCaptured = () => {
    const text = captured.join("");
    captured = [];
    capture = null;
    return text;
  };

  const open = (local: string, raw: string, selfClosing: boolean) => {
    switch (local) {
      case "description":
        if (!selfClosing) skipUntil = `</${raw}>`;
        return;
      case "Placemark":
        placemark = { geometries: [] };
        geometry = null;
        return;
      case "name":
        if (placemark && !geometry && placemark.name === undefined) {
          capture = "name";
        }
        return;
      case "Point":
      case "LineString":
      case "Polygon":
        if (placemark) {
          geometry = { kind: local, coordinates: [], outer: null, inner: [] };
        }
        return;
      case "outerBoundaryIs":
        boundary = "outer";
        return;
      case "innerBoundaryIs":
        boundary = "inner";
        return;
      case "coordinates":
        if (geometry) capture = "coordinates";
        return;
    }
  };

  const close = (local: string) => {
    switch (local) {
      case "name":
        if (capture === "name" && placemark) {
          placemark.name = takeCaptured().trim();
        }
        return;
      case "coordinates": {
        if (capture !== "coordinates" || !geometry) return;
        const positions = parseKmlCoordinates(takeCaptured());
        if (geometry.kind !== "Polygon") geometry.coordinates = positions;
        else if (boundary === "inner") geometry.inner.push(positions);
        else geometry.outer ??= positions;
        return;
      }
      case "outerBoundaryIs":
      case "innerBoundaryIs":
        boundary = null;
        return;
      case "Point":
      case "LineString":
      case "Polygon": {
        const done = geometry && toGeometry(geometry);
        if (done && placemark) placemark.geometries.push(done);
        geometry = null;
        return;
      }
      case "Placemark": {
        const current = placemark as OpenPlacemark | null;
        placemark = null;
        geometry = null;
        if (!current?.geometries.length) return;
        const { geometries } = current;
        const polygons = geometries.filter((g) => g.type === "Polygon").length;
        if (polygons) regionCount += 1;
        polygonCount += polygons;
        for (const g of geometries) {
          coordinateCount +=
            g.type === "Point"
              ? 1
              : g.type === "LineString"
                ? g.coordinates.length
                : g.type === "Polygon"
                  ? g.coordinates.reduce((sum, ring) => sum + ring.length, 0)
                  : 0;
        }
        features.push({
          type: "Feature",
          properties: current.name ? { name: current.name } : {},
          geometry:
            geometries.length === 1
              ? geometries[0]
              : { type: "GeometryCollection", geometries },
        });
        return;
      }
    }
  };

  const tag = (inner: string) => {
    if (inner[0] === "?" || inner[0] === "!") return;
    const closing = inner[0] === "/";
    const body = closing ? inner.slice(1) : inner;
    const raw = /^[^\s/>]+/.exec(body)?.[0];
    if (!raw) return;
    const local = raw.slice(raw.indexOf(":") + 1);
    if (closing) {
      close(local);
      return;
    }
    const selfClosing = inner.endsWith("/");
    open(local, raw, selfClosing);
    if (selfClosing) close(local);
  };

  const push = (text: string) => {
    buffer += text;
    let pos = 0;

    while (pos < buffer.length) {
      if (skipUntil) {
        const end = buffer.indexOf(skipUntil, pos);
        if (end < 0) {
          // O fim pode estar cortado entre dois pedaços.
          const keep = Math.max(pos, buffer.length - skipUntil.length + 1);
          if (skipUntil === "]]>" && capture) {
            captured.push(buffer.slice(pos, keep));
          }
          pos = keep;
          break;
        }
        // CDATA dentro de <name>/<coordinates> é texto.
        if (skipUntil === "]]>" && capture)
          captured.push(buffer.slice(pos, end));
        pos = end + skipUntil.length;
        skipUntil = null;
        continue;
      }

      const lt = buffer.indexOf("<", pos);
      if (lt < 0) {
        if (capture) captured.push(buffer.slice(pos));
        pos = buffer.length;
        break;
      }
      if (capture && lt > pos) captured.push(buffer.slice(pos, lt));

      if (buffer.startsWith("<!--", lt)) {
        skipUntil = "-->";
        pos = lt + 4;
        continue;
      }
      if (buffer.startsWith("<![CDATA[", lt)) {
        skipUntil = "]]>";
        pos = lt + 9;
        continue;
      }
      const gt = buffer.indexOf(">", lt);
      if (gt < 0) {
        // Tag cortada: espera o próximo pedaço.
        pos = lt;
        break;
      }
      tag(buffer.slice(lt + 1, gt));
      pos = gt + 1;
    }

    buffer = buffer.slice(pos);
  };

  return {
    push,
    result: () => ({ features, regionCount, polygonCount, coordinateCount }),
  };
}
