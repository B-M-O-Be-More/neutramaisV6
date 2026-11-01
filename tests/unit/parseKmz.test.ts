import JSZip from "jszip";
import { describe, expect, it } from "vitest";

import {
  KmzParseError,
  MAX_KMZ_BYTES,
  parseKmz,
  PREVIEW_MAX_COORDINATES,
} from "@/functions/parseKmz";

const POLYGON = `
  <Placemark><name>Centro</name><Polygon><outerBoundaryIs><LinearRing>
    <coordinates>-38.0,-4.9 -37.9,-4.9 -37.9,-4.8 -38.0,-4.9</coordinates>
  </LinearRing></outerBoundaryIs></Polygon></Placemark>`;

const MULTI_POLYGON = `
  <Placemark><name>Bairros</name><MultiGeometry>
    <Polygon><outerBoundaryIs><LinearRing>
      <coordinates>-38.1,-4.9 -38.0,-4.9 -38.0,-4.8 -38.1,-4.9</coordinates>
    </LinearRing></outerBoundaryIs></Polygon>
    <Polygon><outerBoundaryIs><LinearRing>
      <coordinates>-38.3,-4.9 -38.2,-4.9 -38.2,-4.8 -38.3,-4.9</coordinates>
    </LinearRing></outerBoundaryIs></Polygon>
  </MultiGeometry></Placemark>`;

const POINT = `<Placemark><name>POP</name><Point><coordinates>-38.0,-4.85</coordinates></Point></Placemark>`;

function kml(placemarks: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2"><Document>${placemarks}</Document></kml>`;
}

async function kmz(
  entries: Record<string, string>,
  name = "cobertura.kmz",
): Promise<File> {
  const zip = new JSZip();
  for (const [path, content] of Object.entries(entries)) {
    zip.file(path, content);
  }
  const bytes = await zip.generateAsync({ type: "arraybuffer" });
  return new File([bytes], name, { type: "application/vnd.google-earth.kmz" });
}

async function errorCode(file: File): Promise<string> {
  try {
    await parseKmz(file);
  } catch (error) {
    if (error instanceof KmzParseError) return error.code;
    throw error;
  }
  throw new Error("parseKmz deveria ter falhado");
}

describe("parseKmz", () => {
  it("lê as geometrias e conta regiões e polígonos (partes de MultiPolygon incluídas)", async () => {
    const file = await kmz({ "doc.kml": kml(POLYGON + MULTI_POLYGON + POINT) });

    const parsed = await parseKmz(file);

    expect(parsed.geometry?.type).toBe("FeatureCollection");
    expect(parsed.geometry?.features).toHaveLength(3);
    // O ponto não é área: 2 regiões, 1 + 2 polígonos.
    expect(parsed.regionCount).toBe(2);
    expect(parsed.polygonCount).toBe(3);
  });

  it("aceita o KML dentro de uma pasta do zip", async () => {
    const file = await kmz({ "files/doc.kml": kml(POLYGON) });

    await expect(parseKmz(file)).resolves.toMatchObject({ regionCount: 1 });
  });

  it("recusa arquivo que não é .kmz", async () => {
    const file = await kmz({ "doc.kml": kml(POLYGON) }, "cobertura.kml");

    expect(await errorCode(file)).toBe("invalidExtension");
  });

  it("recusa arquivo vazio ou acima de 50 MB", async () => {
    expect(await errorCode(new File([], "vazio.kmz"))).toBe("tooLarge");

    const huge = new File(["x"], "grande.kmz");
    Object.defineProperty(huge, "size", { value: MAX_KMZ_BYTES + 1 });
    expect(await errorCode(huge)).toBe("tooLarge");
  });

  it("recusa arquivo que não é zip", async () => {
    const file = new File(["não sou um zip"], "quebrado.kmz");

    expect(await errorCode(file)).toBe("invalidArchive");
  });

  it("exige exatamente um KML", async () => {
    expect(await errorCode(await kmz({ "leia-me.txt": "oi" }))).toBe(
      "kmlCount",
    );
    expect(
      await errorCode(
        await kmz({ "a.kml": kml(POLYGON), "b.kml": kml(POINT) }),
      ),
    ).toBe("kmlCount");
  });

  it("recusa KML sem nenhuma geometria", async () => {
    const file = await kmz({
      "doc.kml": kml("<Placemark><name>Vazio</name></Placemark>"),
    });

    expect(await errorCode(file)).toBe("noGeometry");
  });

  it("lê KML grande em fluxo, pulando os <description> (GPON, KMZ Geral)", async () => {
    // ~40 MB descompactados, quase tudo HTML dos balões — como os KMZs reais.
    const balloon = `<description><![CDATA[<table><tr><td>${"x".repeat(
      400_000,
    )}</td></tr></table>]]></description>`;
    const line = (index: number) =>
      `<Placemark><name>Cabo ${index}</name>${balloon}<LineString><coordinates>-38.${index},-4.9,0 -38.${index},-4.8,0</coordinates></LineString></Placemark>`;
    const zip = new JSZip();
    zip.file(
      "doc.kml",
      kml(Array.from({ length: 100 }, (_, index) => line(index)).join("")),
    );
    const bytes = await zip.generateAsync({
      type: "arraybuffer",
      compression: "DEFLATE",
    });

    const parsed = await parseKmz(new File([bytes], "gpon.kmz"));

    expect(parsed.geometry?.features).toHaveLength(100);
    expect(parsed.geometry?.features[0]).toEqual({
      type: "Feature",
      properties: { name: "Cabo 0" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-38.0, -4.9],
          [-38.0, -4.8],
        ],
      },
    });
    expect(parsed.regionCount).toBe(0);
  }, 30_000);

  it("acima do limite de coordenadas da geo-api, volta sem pré-visualização", async () => {
    const coordinates = Array.from(
      { length: PREVIEW_MAX_COORDINATES + 1 },
      () => "1,2",
    ).join(" ");
    const zip = new JSZip();
    zip.file(
      "doc.kml",
      kml(
        `<Placemark><LineString><coordinates>${coordinates}</coordinates></LineString></Placemark>`,
      ),
    );
    const bytes = await zip.generateAsync({
      type: "arraybuffer",
      compression: "DEFLATE",
    });

    expect(await parseKmz(new File([bytes], "geral.kmz"))).toEqual({
      geometry: null,
    });
  }, 60_000);
});
