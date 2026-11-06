import { describe, expect, it } from "vitest";

import type { CartLine } from "@/functions/cartView";
import {
  addressErrors,
  buildCheckoutBody,
  checkoutErrorKey,
  EMPTY_ADDRESS,
  isMfaRequired,
  normalizePostalCode,
  type ShippingAddressDraft,
} from "@/functions/checkoutBody";
import type { ShippingOption } from "@/services/checkout.service";
import { ApiError, ConflictError, ForbiddenError } from "@/services/errors";

const ADDRESS: ShippingAddressDraft = {
  recipient: "Ana Paula Ribeiro",
  postalCode: "60115-170",
  street: "Rua Silva Paulet",
  number: "1200",
  complement: "",
  district: "Aldeota",
  city: "Fortaleza",
  state: "CE",
};

const SEDEX: ShippingOption = {
  serviceId: "2",
  serviceName: "SEDEX",
  carrier: { id: "1", name: "Correios", logoUrl: null },
  buyerPrice: "47.37",
  currency: "BRL",
  freeShipping: false,
  pickup: false,
  totalDeliveryDays: { min: 2, max: 3 },
};

function line(
  offeringId: string,
  productType: "physical" | "service",
  quantity = 1,
): CartLine {
  return {
    entry: { offeringId, quantity },
    snapshot: {
      schemaVersion: 3,
      offeringId,
      sellerOrganizationId: "seller-1",
      revision: 1,
      snapshotVersion: "a".repeat(64),
      name: "Roteador",
      pricingMode: "fixed",
      currency: "BRL",
      prices: [],
      durationMonths: null,
      speed: null,
      productType,
      stockQuantity: null,
      purchaseLimitPerAccount: null,
      specification: null,
      shipping: null,
    },
    price: { totalMinor: 64990 * quantity, parts: [] },
    maxQuantity: 100,
    problem: null,
  };
}

describe("endereço de entrega do checkout", () => {
  it("normaliza o CEP com ou sem hífen", () => {
    expect(normalizePostalCode("60115-170")).toBe("60115170");
    expect(normalizePostalCode(" 60115170 ")).toBe("60115170");
    expect(normalizePostalCode("6011517")).toBeNull();
  });

  it("aponta os campos fora do contrato", () => {
    expect(addressErrors(ADDRESS)).toEqual([]);
    expect(addressErrors(EMPTY_ADDRESS)).toEqual([
      "recipient",
      "postalCode",
      "street",
      "number",
      "district",
      "city",
      "state",
    ]);
    expect(addressErrors({ ...ADDRESS, state: "XX" })).toEqual(["state"]);
  });
});

describe("corpo do POST checkout", () => {
  it("monta os itens físicos com frete, endereço e saldo da carteira", () => {
    const result = buildCheckoutBody(
      [line("offer-1", "physical", 2)],
      { ...ADDRESS, complement: "  Sala 804 " },
      { "offer-1": SEDEX },
      50000.4,
    );

    expect(result).toEqual({
      body: {
        walletMinor: 50000,
        items: [
          {
            offeringId: "offer-1",
            expectedSnapshotVersion: "a".repeat(64),
            quantity: 2,
            serviceId: "2",
            expectedShippingMinor: 4737,
            shippingAddress: {
              recipient: "Ana Paula Ribeiro",
              postalCode: "60115170",
              street: "Rua Silva Paulet",
              number: "1200",
              complement: "Sala 804",
              district: "Aldeota",
              city: "Fortaleza",
              state: "CE",
              country: "BR",
            },
          },
        ],
      },
    });
  });

  it("não segue com serviço (falta a evidência de viabilidade)", () => {
    expect(
      buildCheckoutBody([line("offer-1", "service")], ADDRESS, {}, 0),
    ).toEqual({ problem: "serviceNeedsViability" });
  });

  it("pede endereço válido e frete escolhido", () => {
    expect(
      buildCheckoutBody(
        [line("offer-1", "physical")],
        EMPTY_ADDRESS,
        { "offer-1": SEDEX },
        0,
      ),
    ).toEqual({ problem: "invalidAddress" });
    expect(
      buildCheckoutBody([line("offer-1", "physical")], ADDRESS, {}, 0),
    ).toEqual({ problem: "missingShipping" });
    expect(
      buildCheckoutBody(
        [line("offer-1", "physical")],
        ADDRESS,
        { "offer-1": { ...SEDEX, buyerPrice: null } },
        0,
      ),
    ).toEqual({ problem: "missingShipping" });
  });
});

describe("erros do checkout", () => {
  it("reconhece o MFA da orders-api e da payment-api", () => {
    expect(
      isMfaRequired(new ForbiddenError(403, [], "", { code: "MFA_REQUIRED" })),
    ).toBe(true);
    expect(
      isMfaRequired(new ForbiddenError(403, [], "", { code: "mfa_required" })),
    ).toBe(true);
    expect(
      isMfaRequired(new ForbiddenError(403, [], "", { detail: "x" })),
    ).toBe(false);
  });

  it("traduz os códigos ORD_* e os 409 sem código", () => {
    expect(
      checkoutErrorKey(
        new ConflictError(409, [], "", { code: "ORD_OFFER_OUT_OF_STOCK" }),
      ),
    ).toBe("Checkout.errors.outOfStock");
    expect(
      checkoutErrorKey(
        new ConflictError(409, [], "", { detail: "Catalog version changed" }),
      ),
    ).toBe("Checkout.errors.offerChanged");
    expect(
      checkoutErrorKey(
        new ConflictError(409, [], "", {
          detail: "Wallet reservation expired",
        }),
      ),
    ).toBe("Checkout.errors.walletReservation");
    expect(checkoutErrorKey(new ApiError(503, [], "", {}))).toBe(
      "Checkout.errors.unavailable",
    );
    expect(checkoutErrorKey(new Error("x"))).toBe("Checkout.errors.failed");
  });
});
