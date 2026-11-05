import { describe, expect, it } from "vitest";

import { geometryAreaKm2 } from "@/functions/geoShapes";
import { mapInfoContent } from "@/functions/mapInfoContent";

describe("mapInfoContent", () => {
  it("monta título e linhas rótulo/valor sem interpretar HTML", () => {
    const element = mapInfoContent("Área do KMZ", [
      ["Nome", "<img src=x onerror=alert(1)>"],
      ["Área", "12 km²"],
    ]);

    expect(element.querySelector("strong")?.textContent).toBe("Área do KMZ");
    const values = [...element.querySelectorAll("dd")].map(
      (item) => item.textContent,
    );
    expect(values).toEqual(["<img src=x onerror=alert(1)>", "12 km²"]);
    expect(element.querySelector("img")).toBeNull();
  });
});

describe("geometryAreaKm2", () => {
  // 0,1° × 0,1° no equador ≈ 123,9 km².
  const square = (x: number, size: number) => [
    [x, 0],
    [x + size, 0],
    [x + size, size],
    [x, size],
    [x, 0],
  ];

  it("soma os polígonos e desconta os furos", () => {
    const outer = geometryAreaKm2({
      type: "Polygon",
      coordinates: [square(0, 0.1)],
    });
    expect(outer).toBeGreaterThan(123);
    expect(outer).toBeLessThan(125);

    const withHole = geometryAreaKm2({
      type: "Polygon",
      coordinates: [square(0, 0.1), square(0.025, 0.05)],
    });
    expect(withHole).toBeCloseTo(outer * 0.75, 0);

    const multi = geometryAreaKm2({
      type: "Feature",
      geometry: {
        type: "MultiPolygon",
        coordinates: [[square(0, 0.1)], [square(1, 0.1)]],
      },
    });
    expect(multi).toBeCloseTo(outer * 2, 0);
    expect(geometryAreaKm2(null)).toBe(0);
  });
});
