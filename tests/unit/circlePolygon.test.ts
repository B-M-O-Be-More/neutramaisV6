import { describe, expect, it } from "vitest";

import { circlePolygon } from "@/functions/circlePolygon";

/** Distância em km pela fórmula de haversine. */
function haversineKm([lng1, lat1]: number[], [lng2, lat2]: number[]): number {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371.0088 * Math.asin(Math.sqrt(a));
}

describe("circlePolygon", () => {
  const CENTER: [number, number] = [-38.5267, -3.7319]; // Fortaleza

  it("gera um anel fechado com os passos pedidos", () => {
    const circle = circlePolygon(CENTER, 10, 32);
    const ring = circle.geometry.coordinates[0];

    expect(circle.geometry.type).toBe("Polygon");
    expect(ring).toHaveLength(33);
    expect(ring[ring.length - 1]).toEqual(ring[0]);
  });

  it("mantém cada ponto à distância do raio", () => {
    const ring = circlePolygon(CENTER, 10).geometry.coordinates[0];

    for (const point of ring) {
      expect(haversineKm(CENTER, point)).toBeCloseTo(10, 6);
    }
  });

  it("começa ao norte do centro", () => {
    const [first] = circlePolygon(CENTER, 10).geometry.coordinates[0];

    expect(first[0]).toBeCloseTo(CENTER[0], 9);
    expect(first[1]).toBeGreaterThan(CENTER[1]);
  });
});
