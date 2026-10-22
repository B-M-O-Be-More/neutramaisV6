import { describe, expect, it } from "vitest";

import {
  meOrganization,
  resolveKycScreen,
  type KycScreen,
} from "@/functions/kycScreen";
import type { MeOrganization, MeProfile } from "@/services/auth.service";

type Scenario = Pick<MeOrganization, "status" | "kyc_state">;

describe("resolveKycScreen", () => {
  // Cenários de buyer e seller (status + kyc_state do /me).
  it.each<[string, Scenario, KycScreen]>([
    [
      "1) sem documentos",
      { status: "pending", kyc_state: "pending" },
      "submit",
    ],
    // `pending_documents` é o estado logo depois do /kyc/submit — e continua
    // assim quando a análise pede correção.
    [
      "2) enviado, em análise",
      { status: "pending", kyc_state: "pending_documents" },
      "review",
    ],
    [
      "3) básico aprovado (seller segue pending)",
      { status: "pending", kyc_state: "basic" },
      "upgrade",
    ],
    [
      "4) básico aprovado (buyer ativo)",
      { status: "active", kyc_state: "basic" },
      "upgrade",
    ],
    ["5) verificado", { status: "active", kyc_state: "verified" }, "approved"],
    [
      "6) KYC completo",
      { status: "active", kyc_state: "complete" },
      "complete",
    ],
    ["7) recusada", { status: "pending", kyc_state: "rejected" }, "rejected"],
    [
      "8) suspensa",
      { status: "suspended", kyc_state: "suspended" },
      "suspended",
    ],
  ])("%s → %s", (_, organization, expected) => {
    expect(resolveKycScreen(organization)).toBe(expected);
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
