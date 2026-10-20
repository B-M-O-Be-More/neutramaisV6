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
    [["admin_neutra"], ["admin"]],
    [["super_admin"], ["admin", "buyer", "seller"]],
    [
      ["buyer_owner", "admin_neutra"],
      ["admin", "buyer"],
    ],
  ])("%j → %j", (roles, expected) => {
    expect(rolesToPersonas(roles)).toEqual(expected);
  });

  it("sem papel reconhecido, cai em buyer", () => {
    expect(rolesToPersonas([])).toEqual(["buyer"]);
    expect(rolesToPersonas(["platform_admin"])).toEqual(["buyer"]);
  });
});
