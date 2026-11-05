import { describe, expect, it } from "vitest";

import { todayIso } from "@/functions/todayIso";

describe("todayIso", () => {
  it("formata a data local como AAAA-MM-DD, com zeros à esquerda", () => {
    expect(todayIso(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
    expect(todayIso(new Date(2026, 11, 31))).toBe("2026-12-31");
  });
});
