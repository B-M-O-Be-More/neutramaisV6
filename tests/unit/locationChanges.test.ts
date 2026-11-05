import { describe, expect, it } from "vitest";

import { changedLocationIndexes } from "@/functions/locationChanges";

const A = { longitude: -38.5, latitude: -3.7, radiusKm: 5, label: "A" };
const B = { longitude: -38.6, latitude: -3.8, radiusKm: 2, label: "B" };
const C = { longitude: -38.7, latitude: -3.9, radiusKm: null, label: "C" };

describe("changedLocationIndexes", () => {
  it("localidade nova: só o índice dela", () => {
    expect(changedLocationIndexes([A, B], [A, B, C])).toEqual([2]);
  });

  it("raio alterado: só o índice dela", () => {
    expect(changedLocationIndexes([A, B], [A, { ...B, radiusKm: 8 }])).toEqual([
      1,
    ]);
  });

  it("nada mudou ou só a última saiu: nenhum", () => {
    expect(changedLocationIndexes([A, B], [A, B])).toEqual([]);
    expect(changedLocationIndexes([A, B, C], [A, B])).toEqual([]);
  });

  it("várias de uma vez (as salvas chegando): todas", () => {
    expect(changedLocationIndexes([], [A, B])).toEqual([0, 1]);
  });
});
