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
    additionalProps: [
      { name: "Velocidade", type: "mbps", values: ["100mbps", "500mbps"] },
    ],
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
      attributes: [
        { name: "Velocidade", type: "mbps", values: "100mbps, 500mbps" },
      ],
    });
  });

  it("sem atributos (ou com itens estranhos), abre uma linha vazia", () => {
    const empty = { name: "", type: "", values: "" };

    expect(
      offeringToFormValues(
        { ...OFFERING, metadata: { additionalProps: "x" } },
        "Conectividade",
      ).attributes,
    ).toEqual([empty]);
    expect(
      offeringToFormValues(
        {
          ...OFFERING,
          metadata: {
            additionalProps: [
              null,
              { name: "Cor", type: "outro", values: [1] },
            ],
          },
        },
        "Hardware / CPE",
      ).attributes,
    ).toEqual([{ name: "Cor", type: "", values: "" }]);
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
          postingDays: 12,
          packageSize: "medium",
          weightEstimated: false,
        },
        metadata: {
          shippingPolicy: {
            mode: "pickup",
            sellerMarkup: "0.00",
            freeShipping: false,
            pickup: true,
            pickupAddress: "Av. Santos Dumont, 3030",
            pickupHours: null,
            automaticTracking: false,
            autoAccept: true,
            cargoPrice: null,
            cargoDeliveryDays: null,
          },
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
      // 4 a 30 dias = sob encomenda.
      shippingDispatch: "onDemand",
      shippingOnDemandDays: "12",
      shippingPackageSize: "medium",
      shippingMode: "pickup",
      shippingExtraFee: "",
      shippingAutoTracking: false,
      shippingAutoAccept: true,
      shippingPickupAddress: "Av. Santos Dumont, 3030",
      shippingPickupHours: "",
    });
    // Ida e volta: o PATCH devolve o mesmo pacote e a mesma política.
    expect(buildOfferingUpdate(values, "spec-1", OFFERING).shipping).toEqual({
      weightKg: 1.25,
      heightCm: 10,
      widthCm: 25.5,
      lengthCm: 30,
      originPostalCode: "01310100",
      postingDays: 12,
      packageSize: "medium",
      insuranceValue: 1200,
    });
    expect(
      buildOfferingUpdate(values, "spec-1", OFFERING).metadata?.shippingPolicy,
    ).toEqual({
      mode: "pickup",
      sellerMarkup: "0.00",
      freeShipping: false,
      pickup: true,
      pickupAddress: "Av. Santos Dumont, 3030",
      pickupHours: null,
      automaticTracking: false,
      autoAccept: true,
      cargoPrice: null,
      cargoDeliveryDays: null,
    });
  });

  it("política antiga sem `mode` usa as flags; prazo padrão é 1 dia útil", () => {
    const values = offeringToFormValues(
      {
        ...OFFERING,
        productType: "physical",
        metadata: { shippingPolicy: { freeShipping: true } },
      },
      "Hardware / CPE",
    );

    expect(values).toMatchObject({
      shippingMode: "freeShipping",
      shippingDispatch: "oneDay",
      shippingPackageSize: "custom",
      shippingAutoTracking: true,
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

  it("a categoria vem do categoryId da oferta antes do nome do plano", () => {
    expect(
      offeringToFormValues(
        { ...OFFERING, categoryId: "0193a000-0000-7000-8000-000000000c03" },
        "Conectividade",
      ).category,
    ).toBe("hardware");
    // categoryId desconhecido: cai no nome do plano (ofertas antigas).
    expect(
      offeringToFormValues(
        { ...OFFERING, categoryId: "categoria-desconhecida" },
        "Conectividade",
      ).category,
    ).toBe("connectivity");
  });

  it("os campos do template vêm das characteristics da especificação", () => {
    expect(
      offeringToFormValues(OFFERING, "Conectividade", { includedIps: 8 }),
    ).toMatchObject({ includedIps: "8" });

    expect(
      offeringToFormValues(OFFERING, "Infra Física", {
        location: "Av. Dom Luís, 300",
        capacity: "48 portas",
        soldUnit: "rack_unit",
        powerSpacePort: "Energia 48V redundante",
      }),
    ).toMatchObject({
      category: "physicalInfra",
      infraCapacity: "48 portas",
      infraSoldUnit: "rack_unit",
      infraPowerSpacePort: "Energia 48V redundante",
    });

    expect(
      offeringToFormValues(
        {
          ...OFFERING,
          metadata: { hardware: { condition: "new", warranty: "1 ano" } },
        },
        "Hardware / CPE",
        { condition: "used", warrantyMonths: 12, serialized: false },
      ),
    ).toMatchObject({
      hardwareCondition: "used",
      hardwareWarranty: "12",
      hardwareSerialization: "no",
    });

    expect(
      offeringToFormValues(OFFERING, "Recursos Numéricos", {
        resourceType: "asn",
        block: "1 ASN",
        allowedUse: "Uso exclusivo do comprador",
        registry: "nic_br",
      }),
    ).toMatchObject({
      numberingResourceType: "asn",
      numberingBlock: "1 ASN",
      numberingHolder: "Uso exclusivo do comprador",
      coverageRegion: "nic_br",
    });
  });

  it("valores do template fora das opções ou do tipo voltam vazios", () => {
    expect(
      offeringToFormValues(OFFERING, "Hardware / CPE", {
        condition: "quebrado",
        warrantyMonths: 1.5,
        serialized: "sim",
      }),
    ).toMatchObject({
      hardwareCondition: "",
      hardwareWarranty: "",
      hardwareSerialization: "",
    });
    expect(
      offeringToFormValues(OFFERING, "Recursos Numéricos", {
        resourceType: "IPv6 /48",
        registry: "LACNIC",
      }),
    ).toMatchObject({ numberingResourceType: "", coverageRegion: "" });
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

  it("atributos apagados somem do metadata", () => {
    const values = {
      ...offeringToFormValues(OFFERING, "Conectividade"),
      attributes: [{ name: "", type: "" as const, values: "" }],
    };

    const update = buildOfferingUpdate(values, "spec-1", OFFERING);

    expect(update.metadata).not.toHaveProperty("additionalProps");
    expect(update.metadata).toMatchObject({ externalRef: "ERP-77" });
  });

});

describe("offeringToFormValues com a árvore de categorias", () => {
  it("com a categoria da árvore, reabre a subcategoria, as flags e os campos genéricos", () => {
    const values = offeringToFormValues(
      { ...OFFERING, categoryId: "0193a000-0000-7000-8000-0000000000d1" },
      "Link dedicado",
      { bandwidthMbps: 500, technology: "fiber", symmetric: false },
      {
        category: "connectivity",
        categoryId: "0193a000-0000-7000-8000-0000000000d1",
        categoryLabel: "Conectividade › Link dedicado",
        requiresCoverage: true,
        hasNumericStock: false,
      },
    );
    expect(values).toMatchObject({
      category: "connectivity",
      categoryId: "0193a000-0000-7000-8000-0000000000d1",
      categoryLabel: "Conectividade › Link dedicado",
      requiresCoverage: true,
      templateValues: { technology: "fiber", symmetric: "false" },
    });
    // `bandwidthMbps` tem tela própria: não vira campo genérico.
    expect(values.templateValues).not.toHaveProperty("bandwidthMbps");
  });

  it("sem a árvore, usa a família conhecida e as flags fixas", () => {
    const values = offeringToFormValues(
      { ...OFFERING, categoryId: "0193a000-0000-7000-8000-000000000c03" },
      undefined,
    );
    expect(values).toMatchObject({
      category: "hardware",
      categoryId: "0193a000-0000-7000-8000-000000000c03",
      requiresCoverage: false,
      hasNumericStock: true,
    });
  });

  it("reabre as regras do template salvas na oferta", () => {
    const values = offeringToFormValues(
      {
        ...OFFERING,
        ruleValues: {
          fastActivation: { maxAcceptanceHours: 48 },
          extendedSupport: null,
        },
      },
      "Conectividade",
    );
    expect(values.rulesEnabled).toEqual({ fastActivation: true });
    expect(values.ruleValues).toEqual({
      fastActivation: { maxAcceptanceHours: "48" },
    });
  });
});
