import { describe, expect, it } from "vitest";

import {
  meOrganization,
  resolveKycScreen,
  type KycScreen,
} from "@/functions/kycScreen";
import type { MeOrganization, MeProfile } from "@/services/auth.service";

type Scenario = Pick<MeOrganization, "status" | "kyc_state">;

describe("resolveKycScreen", () => {
  // Cenários do Seller (status + kyc_state do /me).
  it.each<[string, Scenario, KycScreen]>([
    [
      "1) sem documentos",
      { status: "pending", kyc_state: "pending" },
      "submit",
    ],
    ["2) em análise", { status: "pending", kyc_state: "basic" }, "review"],
    [
      "3) admin pediu mais documentos",
      { status: "pending", kyc_state: "pending_documents" },
      "resubmit",
    ],
    ["4) aprovada", { status: "active", kyc_state: "verified" }, "approved"],
    [
      "5) KYC completo",
      { status: "active", kyc_state: "complete" },
      "complete",
    ],
    ["6) recusada", { status: "pending", kyc_state: "rejected" }, "rejected"],
  ])("%s → %s", (_, organization, expected) => {
    expect(resolveKycScreen(organization)).toBe(expected);
  });

  it("buyer básico autoaprovado (active) pode enviar documentos", () => {
    expect(resolveKycScreen({ status: "active", kyc_state: "basic" })).toBe(
      "submit",
    );
  });
});

describe("meOrganization", () => {
  it("usa o objeto organization do /me", () => {
    const organization: MeOrganization = {
      id: "org-1",
      status: "pending",
      kyc_level: "basic",
      kyc_state: "basic",
    };
    expect(meOrganization({ organization } as MeProfile)).toBe(organization);
  });

  it("cai nos campos soltos (obsoletos) quando organization não vem", () => {
    expect(
      meOrganization({
        organization_id: "org-1",
        org_status: "pending",
        kyc_level: "basic",
        kyc_state: "pending_documents",
      } as unknown as MeProfile),
    ).toEqual({
      id: "org-1",
      status: "pending",
      kyc_level: "basic",
      kyc_state: "pending_documents",
    });
  });
});
