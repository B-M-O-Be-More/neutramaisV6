import { describe, expect, it } from "vitest";

import { rolesToPersonas } from "@/functions/rolesToPersonas";

describe("rolesToPersonas", () => {
  it.each([
    [["buyer_owner"], ["buyer"]],
    [["seller_admin"], ["seller"]],
    [
      ["seller_admin", "buyer_owner", "buyer_member"],
      ["buyer", "seller"],
    ],
    [["SELLER_OWNER"], ["seller"]],
  ])("%j → %j", (roles, expected) => {
    expect(rolesToPersonas(roles)).toEqual(expected);
  });

  it("sem papel reconhecido, cai em buyer", () => {
    expect(rolesToPersonas([])).toEqual(["buyer"]);
    expect(rolesToPersonas(["platform_admin"])).toEqual(["buyer"]);
  });
});
