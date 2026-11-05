import { describe, expect, it } from "vitest";

import {
  contractSignAction,
  isSigningUrl,
  orderTotal,
  sortContractEntries,
  summarizeContracts,
} from "@/functions/contractFormat";
import type { CheckoutOrder } from "@/services/orders.service";
import type {
  ContractEntry,
  ContractStatus,
  OrderContract,
} from "@/types/contracts";

const BUYER_ORG = "3f6c2a1e-8b4d-4c7a-9e21-5d0b7a9c4e12";
const USER = "c41a7e2d-9b3f-4d8a-a1e6-2f7b5c9d3e84";
const OTHER_USER = "7a2b9c1d-3e4f-4a5b-8c6d-9e0f1a2b3c4d";

function contract(
  status: ContractStatus,
  patch: Partial<OrderContract> = {},
): OrderContract {
  return {
    contractId: `contract-${status}`,
    orderId: `order-${status}`,
    checkoutId: "checkout",
    status,
    documentVersion: 1,
    documentHash: "316062f1",
    snapshotVersion: "1af3c20f",
    policy: "buyer-only-v1",
    requiredSignerOrganizations: [BUYER_ORG],
    aggregateVersion: 1,
    recoveryRequired: false,
    lastError: null,
    signatures: [],
    ...patch,
  };
}

const signer = (subject: string, signed = false) => ({
  subject,
  organizationId: BUYER_ORG,
  signed,
});

function order(createdAt: number | null, patch: Partial<CheckoutOrder> = {}) {
  return { checkoutId: "checkout", createdAt, ...patch } as CheckoutOrder;
}

describe("contractSignAction", () => {
  const can = { userId: USER, canSign: true };

  it("o primeiro do Buyer assina; quem já está vinculado reabre o link", () => {
    expect(contractSignAction(contract("awaiting_signer"), can)).toBe("sign");
    expect(
      contractSignAction(
        contract("awaiting_signatures", { signatures: [signer(USER)] }),
        can,
      ),
    ).toBe("open");
  });

  it("outro usuário vinculado não recebe o botão (o /sign daria 409)", () => {
    expect(
      contractSignAction(
        contract("awaiting_signatures", { signatures: [signer(OTHER_USER)] }),
        can,
      ),
    ).toBe("boundToOther");
  });

  it("sem contract:sign, em processamento ou final não há ação", () => {
    expect(
      contractSignAction(contract("awaiting_signer"), {
        userId: USER,
        canSign: false,
      }),
    ).toBe("none");
    (
      [
        "provider_pending",
        "provider_uncertain",
        "provider_failed",
        "signed",
        "cancelled",
      ] as const
    ).forEach((status) =>
      expect(
        contractSignAction(
          contract(status, { signatures: [signer(USER)] }),
          can,
        ),
      ).toBe("none"),
    );
  });
});

describe("summarizeContracts", () => {
  it("agrupa os 7 status nos 4 contadores", () => {
    const entries: ContractEntry[] = (
      [
        "awaiting_signer",
        "awaiting_signatures",
        "provider_pending",
        "provider_uncertain",
        "provider_failed",
        "signed",
        "cancelled",
      ] as const
    ).map((status) => ({ contract: contract(status), order: null }));

    expect(summarizeContracts(entries)).toEqual({
      awaitingSignature: 2,
      processing: 3,
      signed: 1,
      cancelled: 1,
    });
  });
});

describe("sortContractEntries", () => {
  it("ordena pelo pedido mais novo e deixa sem data no fim", () => {
    const entries: ContractEntry[] = [
      { contract: contract("signed"), order: order(1_700_000_000) },
      { contract: contract("cancelled"), order: null },
      { contract: contract("awaiting_signer"), order: order(1_800_000_000) },
    ];

    expect(
      sortContractEntries(entries).map(({ contract }) => contract.status),
    ).toEqual(["awaiting_signer", "signed", "cancelled"]);
  });
});

describe("orderTotal", () => {
  it("formata o total do checkout em centavos", () => {
    const brl = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    expect(
      orderTotal(
        order(null, { totalMinor: 110_100, currency: "BRL" }),
        "pt-BR",
      ),
    ).toEqual({ value: brl.format(1101), monthly: false });
  });
});

describe("isSigningUrl", () => {
  it("aceita só https nos hosts da Autentique", () => {
    expect(isSigningUrl("https://assina.ae/Xk7pQ2mR")).toBe(true);
    expect(isSigningUrl("https://app.autentique.com.br/x")).toBe(true);
    expect(isSigningUrl("http://assina.ae/Xk7pQ2mR")).toBe(false);
    expect(isSigningUrl("https://assina.ae.evil.test/x")).toBe(false);
    expect(isSigningUrl("javascript:alert(1)")).toBe(false);
  });
});
