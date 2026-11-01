import { describe, expect, it } from "vitest";

import {
  createKmlGeometryReader,
  parseKmlCoordinates,
} from "@/functions/kmlGeometry";

const KML = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:kml="http://www.opengis.net/kml/2.2">
<Document><name>Rede</name>
  <!-- <Placemark><Point><coordinates>9,9</coordinates></Point></Placemark> -->
  <Style id="s"><BalloonStyle><text><![CDATA[<b>$[name]</b> <coordinates>8,8</coordinates>]]></text></BalloonStyle></Style>
  <Folder><name>POPs</name>
    <Placemark>
      <name><![CDATA[POP Centro]]></name>
      <description><![CDATA[<p>Rua <b>1</b></p></description>]]></description>
      <Point><coordinates> -38.5 , -3.7 , 0 </coordinates></Point>
    </Placemark>
  </Folder>
  <kml:Placemark><kml:name>Bairro</kml:name>
    <kml:MultiGeometry>
      <kml:Polygon>
        <kml:outerBoundaryIs><kml:LinearRing><kml:coordinates>0,0 4,0 4,4 0,4</kml:coordinates></kml:LinearRing></kml:outerBoundaryIs>
        <kml:innerBoundaryIs><kml:LinearRing><kml:coordinates>1,1 2,1 2,2 1,1</kml:coordinates></kml:LinearRing></kml:innerBoundaryIs>
      </kml:Polygon>
      <kml:LineString><kml:coordinates>0,0 9,9</kml:coordinates></kml:LineString>
    </kml:MultiGeometry>
  </kml:Placemark>
  <Placemark><name>Sem geometria</name><description/></Placemark>
  <Placemark><name>Linha de um ponto</name><LineString><coordinates>1,1</coordinates></LineString></Placemark>
</Document></kml>`;

function readAll(chunks: string[]) {
  const reader = createKmlGeometryReader();
  chunks.forEach((chunk) => reader.push(chunk));
  return reader.result();
}

describe("parseKmlCoordinates", () => {
  it("lê lon,lat com ou sem altitude e ignora tuplas inválidas", () => {
    expect(
      parseKmlCoordinates("\n -38.5,-3.7,12  -38.4 , -3.6\tabc,1 5"),
    ).toEqual([
      [-38.5, -3.7],
      [-38.4, -3.6],
    ]);
  });
});

describe("createKmlGeometryReader", () => {
  const expected = [
    {
      type: "Feature",
      properties: { name: "POP Centro" },
      geometry: { type: "Point", coordinates: [-38.5, -3.7] },
    },
    {
      type: "Feature",
      properties: { name: "Bairro" },
      geometry: {
        type: "GeometryCollection",
        geometries: [
          {
            type: "Polygon",
            coordinates: [
              // O anel aberto é fechado.
              [
                [0, 0],
                [4, 0],
                [4, 4],
                [0, 4],
                [0, 0],
              ],
              [
                [1, 1],
                [2, 1],
                [2, 2],
                [1, 1],
              ],
            ],
          },
          {
            type: "LineString",
            coordinates: [
              [0, 0],
              [9, 9],
            ],
          },
        ],
      },
    },
  ];

  it("guarda só Placemarks com geometria; pula comentário, CDATA e description", () => {
    const result = readAll([KML]);

    expect(result.features).toEqual(expected);
    expect(result.regionCount).toBe(1);
    expect(result.polygonCount).toBe(1);
    expect(result.coordinateCount).toBe(1 + 5 + 4 + 2);
  });

  it.each([1, 2, 3, 7, 64])(
    "dá o mesmo resultado com o texto cortado a cada %i caracteres",
    (size) => {
      const chunks = KML.match(new RegExp(`[\\s\\S]{1,${size}}`, "g")) ?? [];

      expect(readAll(chunks).features).toEqual(expected);
    },
  );
});
