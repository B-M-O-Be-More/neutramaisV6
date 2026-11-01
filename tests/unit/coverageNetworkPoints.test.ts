import { describe, expect, it } from "vitest";

import {
  formatCoordinates,
  locationsToCoverageNetworkPoints,
  coverageNetworkPointsOf,
  coverageNetworkPointsToLocations,
  sameCoverageNetworkPoints,
} from "@/functions/coverageNetworkPoints";

const SAO_PAULO = { longitude: -46.655, latitude: -23.56 };

describe("coverageNetworkPoints", () => {
  it("localidades do formulário viram coverageNetworkPoints com o raio em metros", () => {
    expect(
      locationsToCoverageNetworkPoints([
        { ...SAO_PAULO, label: "Av. Paulista", radiusKm: "1,5" },
        // Sem endereço escolhido: fica de fora, sem erro.
        { label: "", longitude: null, latitude: null, radiusKm: "" },
      ]),
    ).toEqual({
      points: [{ ...SAO_PAULO, radiusMeters: 1500 }],
      invalid: false,
    });
  });

  it.each(["", "0,5", "80,5"])(
    "ponto com raio %j fora de 1–80 km é inválido",
    (radiusKm) => {
      expect(
        locationsToCoverageNetworkPoints([
          { ...SAO_PAULO, label: "SP", radiusKm },
        ]),
      ).toEqual({ points: [], invalid: true });
    },
  );

  it("coverageNetworkPoints salvos voltam como localidades, rotuladas pela coordenada", () => {
    expect(
      coverageNetworkPointsToLocations([{ ...SAO_PAULO, radiusMeters: 1234 }]),
    ).toEqual([
      {
        label: formatCoordinates(SAO_PAULO.longitude, SAO_PAULO.latitude),
        ...SAO_PAULO,
        radiusKm: "1,2",
      },
    ]);
    expect(formatCoordinates(-46.655, -23.56)).toBe("-23.56000, -46.65500");
  });

  it("compara tolerando o arredondamento do campo (100 m)", () => {
    const saved = [{ ...SAO_PAULO, radiusMeters: 1234 }];
    const [shown] = locationsToCoverageNetworkPoints(
      coverageNetworkPointsToLocations(saved),
    ).points;

    expect(sameCoverageNetworkPoints(saved, [shown])).toBe(true);
    expect(
      sameCoverageNetworkPoints(saved, [{ ...shown, radiusMeters: 1500 }]),
    ).toBe(false);
    expect(sameCoverageNetworkPoints(saved, [])).toBe(false);
  });

  it("da API só aceita pontos válidos", () => {
    expect(
      coverageNetworkPointsOf([
        { ...SAO_PAULO, radiusMeters: 800 },
        { longitude: 200, latitude: 0, radiusMeters: 800 },
        { ...SAO_PAULO, radiusMeters: 0 },
        "x",
      ]),
    ).toEqual([{ ...SAO_PAULO, radiusMeters: 800 }]);
    expect(coverageNetworkPointsOf(null)).toEqual([]);
  });
});
