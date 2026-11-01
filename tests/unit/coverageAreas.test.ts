import { describe, expect, it } from "vitest";

import {
  coverageAreaOf,
  isCoverageAreaIndexList,
  savedAreaIndexesOf,
  selectedAreasGeometry,
} from "@/functions/coverageAreas";

const square = (x: number, y: number) => [
  [
    [x, y],
    [x + 1, y],
    [x + 1, y + 1],
    [x, y + 1],
    [x, y],
  ],
];

describe("coverageAreas (áreas do KMZ)", () => {
  it("transforma o placemark com polígono numa área escolhível", () => {
    const area = coverageAreaOf({
      placemarkIndex: 7,
      name: " Centro ",
      folderPath: ["Regional Sul", "Curitiba"],
      geometry: { type: "Polygon", coordinates: square(0, 0) },
    });

    expect(area).toMatchObject({
      index: 7,
      name: "Centro",
      folder: "Regional Sul / Curitiba",
      geometry: { type: "Polygon", coordinates: square(0, 0) },
    });
    expect(area?.areaKm2).toBeGreaterThan(0);
  });

  it("junta os polígonos de uma coleção e descarta pontos e linhas", () => {
    expect(
      coverageAreaOf({
        placemarkIndex: 1,
        geometry: {
          type: "GeometryCollection",
          geometries: [
            { type: "Point", coordinates: [0, 0] },
            { type: "Polygon", coordinates: square(0, 0) },
            { type: "Polygon", coordinates: square(2, 2) },
          ],
        },
      })?.geometry,
    ).toEqual({
      type: "MultiPolygon",
      coordinates: [square(0, 0), square(2, 2)],
    });

    for (const element of [
      { placemarkIndex: 2, geometry: { type: "Point", coordinates: [0, 0] } },
      { placemarkIndex: 3, geometry: null },
      {
        name: "sem índice",
        geometry: { type: "Polygon", coordinates: square(0, 0) },
      },
      null,
    ]) {
      expect(coverageAreaOf(element)).toBeNull();
    }
  });

  it("desenha só as áreas escolhidas", () => {
    const areas = [0, 1, 2].map(
      (index) =>
        coverageAreaOf({
          placemarkIndex: index,
          geometry: { type: "Polygon", coordinates: square(index * 2, 0) },
        })!,
    );

    expect(selectedAreasGeometry(areas, [2])).toEqual({
      type: "Polygon",
      coordinates: square(4, 0),
    });
    expect(selectedAreasGeometry(areas, [0, 2])).toEqual({
      type: "MultiPolygon",
      coordinates: [square(0, 0), square(4, 0)],
    });
    expect(selectedAreasGeometry(areas, [])).toBeNull();
  });

  it("aceita de 1 a 500 índices inteiros ≥ 0, sem repetidos", () => {
    expect(isCoverageAreaIndexList([0, 3])).toBe(true);
    for (const value of [
      [],
      [1, 1],
      [-1],
      [0.5],
      ["0"],
      Array.from({ length: 501 }, (_, i) => i),
      null,
    ]) {
      expect(isCoverageAreaIndexList(value)).toBe(false);
    }
  });

  it("lê os índices salvos na escolha do seller", () => {
    expect(savedAreaIndexesOf({ areaIndexes: [4, 1] })).toEqual([4, 1]);
    expect(savedAreaIndexesOf({ publicGeometry: {} })).toBeNull();
    expect(savedAreaIndexesOf(null)).toBeNull();
  });
});
