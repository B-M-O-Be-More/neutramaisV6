import { describe, expect, it } from "vitest";

import {
  boundsOf,
  closedPolygon,
  hasArea,
  pointInArea,
  polygonWithinArea,
  shapeAreaKm2,
  shapeIsInvalid,
  shapesOf,
  shapesOverlap,
  toPublicGeometry,
  type LngLat,
} from "@/functions/geoShapes";

// Quadrado 0..10 com um buraco 4..6 no meio.
const SQUARE_WITH_HOLE = {
  type: "Feature",
  properties: {},
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
        [0, 0],
      ],
      [
        [4, 4],
        [6, 4],
        [6, 6],
        [4, 6],
        [4, 4],
      ],
    ],
  },
};

describe("geoShapes", () => {
  it("boundsOf junta as coordenadas de vários GeoJSON", () => {
    expect(
      boundsOf(SQUARE_WITH_HOLE, { type: "Point", coordinates: [12, -2] }),
    ).toEqual([
      [0, -2],
      [12, 10],
    ]);
    expect(boundsOf(null, { type: "FeatureCollection", features: [] })).toBe(
      null,
    );
  });

  it("pointInArea respeita buracos e ignora pontos e linhas", () => {
    expect(pointInArea([2, 2], SQUARE_WITH_HOLE)).toBe(true);
    expect(pointInArea([5, 5], SQUARE_WITH_HOLE)).toBe(false);
    expect(pointInArea([11, 5], SQUARE_WITH_HOLE)).toBe(false);
    expect(pointInArea([0, 0], { type: "Point", coordinates: [0, 0] })).toBe(
      false,
    );
  });

  it("pointInArea aceita MultiPolygon e coleções", () => {
    const area = {
      type: "GeometryCollection",
      geometries: [
        {
          type: "MultiPolygon",
          coordinates: [
            [
              [
                [20, 20],
                [30, 20],
                [30, 30],
                [20, 20],
              ],
            ],
          ],
        },
      ],
    };
    expect(pointInArea([28, 22], area)).toBe(true);
    expect(hasArea(area)).toBe(true);
    expect(hasArea({ type: "LineString", coordinates: [] })).toBe(false);
  });

  it("closedPolygon repete o primeiro ponto no fim do anel", () => {
    const points: LngLat[] = [
      [1, 1],
      [3, 1],
      [3, 3],
    ];
    expect(closedPolygon(points)).toEqual({
      type: "Polygon",
      coordinates: [
        [
          [1, 1],
          [3, 1],
          [3, 3],
          [1, 1],
        ],
      ],
    });
  });

  it("polygonWithinArea exige todos os vértices dentro da área", () => {
    const inside = closedPolygon([
      [1, 1],
      [3, 1],
      [3, 3],
    ]);
    const crossing = closedPolygon([
      [1, 1],
      [12, 1],
      [3, 3],
    ]);
    expect(polygonWithinArea(inside, SQUARE_WITH_HOLE)).toBe(true);
    expect(polygonWithinArea(crossing, SQUARE_WITH_HOLE)).toBe(false);
  });
});

describe("recorte público com vários polígonos", () => {
  const A: LngLat[] = [
    [1, 1],
    [2, 1],
    [2, 2],
  ];
  const B: LngLat[] = [
    [5, 5],
    [6, 5],
    [6, 6],
    [5, 6],
  ];

  it("um polígono vira Polygon; vários, MultiPolygon", () => {
    expect(toPublicGeometry([])).toBeNull();
    expect(toPublicGeometry([A])).toEqual(closedPolygon(A));
    expect(toPublicGeometry([A, B])).toEqual({
      type: "MultiPolygon",
      coordinates: [closedPolygon(A).coordinates, closedPolygon(B).coordinates],
    });
  });

  it("devolve as formas desenhadas sem o ponto de fechamento", () => {
    expect(shapesOf(null)).toEqual([]);
    expect(shapesOf(toPublicGeometry([A]))).toEqual([A]);
    expect(shapesOf(toPublicGeometry([A, B]))).toEqual([A, B]);
  });

  it("calcula a área aproximada em km²", () => {
    // 1° × 1° no equador ≈ 12.391 km² na esfera de raio 6.378.137 m.
    const square: LngLat[] = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ];
    expect(shapeAreaKm2(square)).toBeCloseTo(12391, -1);
    expect(shapeAreaKm2([...square].reverse())).toBeCloseTo(12391, -1);
    expect(shapeAreaKm2(square.slice(0, 2))).toBe(0);
  });
});

describe("validade do recorte", () => {
  const square = (x: number, y: number, size = 2): LngLat[] => [
    [x, y],
    [x + size, y],
    [x + size, y + size],
    [x, y + size],
  ];

  it("recusa polígono que se cruza ou sem área", () => {
    expect(shapeIsInvalid(square(0, 0))).toBe(false);
    expect(
      shapeIsInvalid([
        [0, 0],
        [2, 2],
        [2, 0],
        [0, 2],
      ]),
    ).toBe(true);
    expect(
      shapeIsInvalid([
        [0, 0],
        [1, 1],
        [2, 2],
      ]),
    ).toBe(true);
  });

  it("detecta sobreposição, contato e polígono dentro de outro", () => {
    expect(shapesOverlap(square(0, 0), square(5, 5))).toBe(false);
    expect(shapesOverlap(square(0, 0), square(1, 1))).toBe(true);
    // Lado encostado também é recusado pela geo-api.
    expect(shapesOverlap(square(0, 0), square(2, 0))).toBe(true);
    expect(shapesOverlap(square(0, 0, 6), square(2, 2))).toBe(true);
  });
});
