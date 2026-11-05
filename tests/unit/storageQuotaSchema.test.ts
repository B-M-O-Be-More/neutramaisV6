import { describe, expect, it } from "vitest";

import { clampQuotaMb, storageQuotaSchema } from "@/schemas/storageQuota";

const errorOf = async (values: { quotaMb: number; reason: string }) => {
  try {
    await storageQuotaSchema.validate(values);
    return null;
  } catch (error) {
    return (error as Error).message;
  }
};

const REASON = "Ampliação aprovada pelo comercial";

describe("storageQuotaSchema", () => {
  it.each([50, 500, 1000])("aceita %i MB", async (quota) => {
    expect(await errorOf({ quotaMb: quota, reason: REASON })).toBeNull();
  });

  it.each([
    [Number.NaN, "quotaRequired"],
    [512.5, "quotaInvalid"],
    [49, "quotaRange"],
    [1001, "quotaRange"],
  ])("recusa %s", async (quota, key) => {
    expect(await errorOf({ quotaMb: quota, reason: REASON })).toBe(
      `CoverageStorage.quota.errors.${key}`,
    );
  });

  it.each([
    ["   ", "reasonRequired"],
    ["  curto  ", "reasonTooShort"],
  ])("exige motivo com 10 caracteres (%j)", async (reason, key) => {
    expect(await errorOf({ quotaMb: 500, reason })).toBe(
      `CoverageStorage.quota.errors.${key}`,
    );
  });

  it("parte da cota atual dentro da faixa do slider", () => {
    expect(clampQuotaMb(0)).toBe(50);
    expect(clampQuotaMb(200)).toBe(200);
    expect(clampQuotaMb(512.4)).toBe(512);
    expect(clampQuotaMb(1200)).toBe(1000);
  });
});
