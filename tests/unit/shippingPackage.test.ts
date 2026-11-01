import { describe, expect, it } from "vitest";

import { nearestCapital } from "@/data/postalCodeCapitals";
import { packagePreset } from "@/data/shippingPackagePresets";
import {
  exceedsMarketLimits,
  gramsToKgText,
  kgToGramsText,
} from "@/functions/shippingPackage";

describe("peso do pacote", () => {
  it.each([
    ["1,25", "1250"],
    ["1,2506", "1251"],
    ["3", "3000"],
    ["", ""],
  ])("kg %j → %j g", (kg, grams) => {
    expect(kgToGramsText(kg)).toBe(grams);
  });

  it.each([
    ["1250", "1,25"],
    ["3000", "3"],
    ["1", "0,001"],
    ["", ""],
  ])("%j g → %j kg", (grams, kg) => {
    expect(gramsToKgText(grams)).toBe(kg);
  });
});

describe("limite de mercado", () => {
  const box = { weightKg: "15", heightCm: "40", widthCm: "50", lengthCm: "60" };

  it("até 30 kg, 100 cm por lado e 200 cm na soma cabe", () => {
    expect(exceedsMarketLimits(box)).toBe(false);
  });

  it.each([
    ["peso", { weightKg: "30,001" }],
    ["lado", { lengthCm: "101" }],
    ["soma dos lados", { heightCm: "60", widthCm: "60", lengthCm: "81" }],
  ])("passa pelo %s", (_, change) => {
    expect(exceedsMarketLimits({ ...box, ...change })).toBe(true);
  });

  it("sem peso ou medida, ainda não se sabe", () => {
    expect(exceedsMarketLimits({ ...box, widthCm: "" })).toBeNull();
  });
});

describe("tamanhos prontos de embalagem", () => {
  it("usam as medidas e o peso da marketplace-api", () => {
    expect(packagePreset("small")).toMatchObject({
      heightCm: 15,
      widthCm: 15,
      lengthCm: 15,
      weightG: 500,
      maxWeightKg: 1,
    });
    expect(packagePreset("large")).toMatchObject({
      heightCm: 40,
      widthCm: 50,
      lengthCm: 60,
      weightG: 15000,
    });
    expect(packagePreset("cargo")).toBeUndefined();
  });
});

describe("capital mais próxima pelo CEP", () => {
  it.each([
    ["60150-161", "Fortaleza/CE"],
    ["01310-100", "São Paulo/SP"],
    ["69301-000", "Boa Vista/RR"],
    ["70040-010", "Brasília/DF"],
    ["74000-000", "Goiânia/GO"],
    ["90010-000", "Porto Alegre/RS"],
  ])("%s → %s", (postalCode, capital) => {
    expect(nearestCapital(postalCode)).toBe(capital);
  });

  it("CEP incompleto não tem capital", () => {
    expect(nearestCapital("6015")).toBeNull();
    expect(nearestCapital("00000-000")).toBeNull();
  });
});
