import { describe, expect, it } from "vitest";

import { formatTaxId } from "@/functions/formatTaxId";

describe("formatTaxId", () => {
  it("formata CNPJ com 14 dígitos", () => {
    expect(formatTaxId("12345678000195", "CNPJ")).toBe("12.345.678/0001-95");
  });

  it.each([
    ["outro tipo", "123456789", "EIN"],
    ["CNPJ incompleto", "1234", "CNPJ"],
    ["sem tipo", "12345678000195", undefined],
  ])("mantém o valor original (%s)", (_, taxId, kind) => {
    expect(formatTaxId(taxId, kind)).toBe(taxId);
  });
});
