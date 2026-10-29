import { describe, expect, it } from "vitest";

import { parseDecimal } from "@/functions/parseDecimal";

describe("parseDecimal", () => {
  it.each([
    ["98,5", 98.5],
    ["98.5", 98.5],
    ["98,5%", 98.5],
    [" 99,95 % ", 99.95],
    ["1.000,5", 1000.5],
    ["500", 500],
    ["0,5", 0.5],
  ])("lê %j como %d", (input, expected) => {
    expect(parseDecimal(input)).toBe(expected);
  });

  it.each(["", "   ", "%", "abc", "98,5,1", "1e3", "12 Mbps"])(
    "devolve null para %j",
    (input) => {
      expect(parseDecimal(input)).toBeNull();
    },
  );

  it("aceita null e undefined", () => {
    expect(parseDecimal(null)).toBeNull();
    expect(parseDecimal(undefined)).toBeNull();
  });
});
