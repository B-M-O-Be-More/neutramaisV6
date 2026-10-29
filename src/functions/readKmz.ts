// Abre o .kmz e lê a geometria do KML em fluxo: descompacta aos pedaços e
// passa cada um para o leitor de KML, sem montar o texto inteiro (o "KMZ
// Geral" tem 544 MB de KML). Roda no Web Worker de `parseKmz`, ou direto
// quando não há Worker (testes).

import { createKmlGeometryReader } from "./kmlGeometry";

/**
 * Acima disso a pré-visualização é descartada: é o limite de coordenadas por
 * arquivo da geo-api, que recusa o envio de qualquer forma.
 */
export const PREVIEW_MAX_COORDINATES = 5_000_000;

export type KmzErrorCode =
  | "invalidExtension"
  | "tooLarge"
  | "invalidArchive"
  | "kmlCount"
  | "noGeometry";

export class KmzParseError extends Error {
  constructor(public readonly code: KmzErrorCode) {
    super(code);
    this.name = "KmzParseError";
  }
}

export interface ParsedKmz {
  /**
   * FeatureCollection pronta para o Mapbox; null quando passa do limite de
   * coordenadas (a geo-api valida no envio).
   */
  geometry: { type: "FeatureCollection"; features: unknown[] } | null;
  /** Placemarks com área (Polygon/MultiPolygon); só com a geometria lida. */
  regionCount?: number;
  /** Total de polígonos, contando as partes de MultiGeometry. */
  polygonCount?: number;
}

const NO_PREVIEW: ParsedKmz = { geometry: null };

// `internalStream` existe no JSZipObject, mas não nos tipos do pacote.
interface ChunkStream {
  on(event: "data", callback: (chunk: Uint8Array) => void): ChunkStream;
  on(event: "end", callback: () => void): ChunkStream;
  on(event: "error", callback: (error: Error) => void): ChunkStream;
  resume(): ChunkStream;
  pause(): ChunkStream;
}

/** Lê o KML do .kmz. Lança `KmzParseError` quando o arquivo não serve. */
export async function readKmz(file: Blob): Promise<ParsedKmz> {
  const { default: JSZip } = await import("jszip");

  let archive: InstanceType<typeof JSZip>;
  try {
    archive = await JSZip.loadAsync(file);
  } catch {
    throw new KmzParseError("invalidArchive");
  }

  const kmlEntries = Object.values(archive.files).filter(
    (entry) => !entry.dir && entry.name.toLowerCase().endsWith(".kml"),
  );
  if (kmlEntries.length !== 1) throw new KmzParseError("kmlCount");

  const reader = createKmlGeometryReader();
  const decoder = new TextDecoder("utf-8");
  const stream = (
    kmlEntries[0] as unknown as {
      internalStream(type: "uint8array"): ChunkStream;
    }
  ).internalStream("uint8array");

  const complete = await new Promise<boolean>((resolve, reject) => {
    stream
      .on("data", (chunk) => {
        reader.push(decoder.decode(chunk, { stream: true }));
        if (reader.result().coordinateCount > PREVIEW_MAX_COORDINATES) {
          stream.pause();
          resolve(false);
        }
      })
      .on("end", () => {
        reader.push(decoder.decode());
        resolve(true);
      })
      .on("error", () => reject(new KmzParseError("invalidArchive")))
      .resume();
  });
  if (!complete) return NO_PREVIEW;

  const { features, regionCount, polygonCount } = reader.result();
  if (!features.length) throw new KmzParseError("noGeometry");

  return {
    geometry: { type: "FeatureCollection", features },
    regionCount,
    polygonCount,
  };
}
