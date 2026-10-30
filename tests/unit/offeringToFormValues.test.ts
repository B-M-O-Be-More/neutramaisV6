import { describe, expect, it } from "vitest";

import {
  buildOfferingPayload,
  buildOfferingUpdate,
} from "@/functions/buildOfferingPayload";
import { offeringToFormValues } from "@/functions/offeringToFormValues";
import type { ProductOffering } from "@/services/productCatalog.service";

const OFFERING: ProductOffering = {
  id: "0192a0b1-d4e5-7f60-8a9b-0c1d2e3f4a5c",
  organizationId: "org-1",
  specificationId: "spec-1",
  name: "Internet Fibra Premium 500 Mbps",
  monthlyPrice: "1890.00",
  installationPrice: "500.00",
  speed: "500 Mbps",
  durationMonths: 12,
  isPublic: true,
  status: "published",
  isCorporate: false,
  stateCode: null,
  isCapital: false,
  coverageVersionId: "018f4c2a-9b31-7d64-a0e5-2f7c1b8d3e90",
  isActive: true,
  isPromoted: true,
  createdAt: "2026-03-01T10:00:00Z",
  updatedAt: "2026-03-01T10:00:00Z",
  metadata: {
    shortDescription: "Fibra simétrica com IP fixo",
    description: "Link de fibra óptica premium com IP fixo /29 incluso.",
    technicalSlaPercent: 99.5,
    acceptanceSlaHours: 24,
    maxLatencyMs: 12,
    deliveryTime: "30 dias úteis",
    pricingModel: "monthly",
    currency: "BRL",
    stock: 3,
    cancellationTerms: "30 dias corridos",
    validUntil: "2026-12-31",
    // Chave de outra integração: precisa sobreviver à edição.
    externalRef: "ERP-77",
  },
};

describe("offeringToFormValues", () => {
  it("reabre a oferta salva com os valores do assistente", () => {
    const values = offeringToFormValues(OFFERING, "Conectividade");

    expect(values).toMatchObject({
      category: "connectivity",
      name: OFFERING.name,
      shortDescription: "Fibra simétrica com IP fixo",
      speedValue: "500",
      speedUnit: "Mbps",
      maxLatency: "12",
      acceptanceSla: "24",
      technicalSla: "99,5",
      deliveryTime: "30 dias úteis",
      pricingModel: "monthly",
      currency: "BRL",
      price: "1.890,00",
      setupFee: "500,00",
      stock: "3",
      validUntil: "2026-12-31",
      sponsored: true,
    });
  });

  it("usa os padrões quando o metadata falta ou tem valores estranhos", () => {
    const values = offeringToFormValues(
      {
        ...OFFERING,
        speed: null,
        installationPrice: "0.00",
        isPromoted: false,
        metadata: { pricingModel: "weekly", currency: "EUR", stock: "x" },
      },
      "Plano sem categoria",
    );

    expect(values).toMatchObject({
      category: "",
      speedValue: "",
      speedUnit: "Mbps",
      acceptanceSla: "48",
      pricingModel: "",
      currency: "BRL",
      setupFee: "",
      stock: "",
      sponsored: false,
    });
  });

  it("reabre o produto físico com o tipo salvo e o pacote de envio", () => {
    const values = offeringToFormValues(
      {
        ...OFFERING,
        productType: "physical",
        coverageVersionId: null,
        shipping: {
          weightKg: "1.250",
          heightCm: "10.00",
          widthCm: "25.50",
          lengthCm: "30.00",
          originPostalCode: "01310100",
          insuranceValue: "1200.00",
        },
      },
      "Hardware / CPE",
    );

    expect(values).toMatchObject({
      category: "hardware",
      productType: "physical",
      shippingWeightKg: "1,25",
      shippingHeightCm: "10",
      shippingWidthCm: "25,5",
      shippingLengthCm: "30",
      shippingOriginPostalCode: "01310-100",
      shippingInsuranceValue: "1.200,00",
    });
    // Ida e volta: o PATCH devolve o mesmo pacote.
    expect(buildOfferingUpdate(values, "spec-1", OFFERING).shipping).toEqual({
      weightKg: 1.25,
      heightCm: 10,
      widthCm: 25.5,
      lengthCm: 30,
      originPostalCode: "01310100",
      insuranceValue: 1200,
    });
  });

  it("oferta antiga, sem o campo, reabre como serviço sem pacote", () => {
    const values = offeringToFormValues(OFFERING, "Conectividade");

    expect(values).toMatchObject({
      productType: "service",
      shippingWeightKg: "",
      shippingOriginPostalCode: "",
    });
  });

  it("ida e volta: os valores reabertos geram o mesmo corpo", () => {
    const values = offeringToFormValues(OFFERING, "Conectividade");
    const payload = buildOfferingPayload(values, "spec-1");

    expect(payload).toMatchObject({
      name: OFFERING.name,
      monthlyPrice: "1890.00",
      installationPrice: "500.00",
      speed: "500 Mbps",
    });
    expect(payload.metadata).toMatchObject({
      technicalSlaPercent: 99.5,
      acceptanceSlaHours: 24,
      stock: 3,
    });
  });
});

describe("buildOfferingUpdate", () => {
  it("reescreve as chaves do assistente e mantém as de outras origens", () => {
    const values = {
      ...offeringToFormValues(OFFERING, "Conectividade"),
      // Campo apagado na edição: some do metadata.
      validUntil: "",
      deliveryTime: "15 dias úteis",
    };

    const update = buildOfferingUpdate(values, "spec-2", OFFERING);

    expect(update.specificationId).toBe("spec-2");
    expect(update.metadata).toMatchObject({
      externalRef: "ERP-77",
      deliveryTime: "15 dias úteis",
    });
    expect(update.metadata).not.toHaveProperty("validUntil");
  });
});
