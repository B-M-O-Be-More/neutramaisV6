import { describe, expect, it } from "vitest";

import {
  buildOfferingPayload,
  buildOfferingUpdate,
  toApiDecimal,
} from "@/functions/buildOfferingPayload";
import type { SellerOfferValues } from "@/schemas/sellerOffer";
import type { ProductOffering } from "@/services/productCatalog.service";

const BASE: SellerOfferValues = {
  category: "connectivity",
  categoryId: "0193a000-0000-7000-8000-000000000c01",
  categoryLabel: "Conectividade",
  requiresCoverage: true,
  hasNumericStock: false,
  templateValues: {},
  rulesEnabled: {},
  ruleValues: {},
  locations: [
    {
      label: "Av. Dom Luís, 300, Caucaia - CE",
      longitude: -38.65,
      latitude: -3.73,
      radiusKm: "10",
    },
  ],
  coverageRegion: "",
  name: "  Link Dedicado 1 Gbps  ",
  shortDescription: "Link simétrico com SLA",
  description: "x".repeat(60),
  speedValue: "1",
  speedUnit: "Gbps",
  maxLatency: "5",
  acceptanceSla: "48",
  technicalSla: "99,5",
  deliveryTime: "30 dias após o aceite",
  hardwareManufacturer: "Mikrotik",
  hardwareModel: "RB4011",
  hardwareCondition: "new",
  hardwareWarranty: "",
  hardwareSerialization: "",
  includedIps: "",
  infraCapacity: "",
  infraSoldUnit: "",
  infraPowerSpacePort: "",
  numberingResourceType: "ipv6",
  numberingBlock: "/48",
  numberingHolder: "Cessão definitiva",
  // Linha vazia do formulário: não vai no payload.
  attributes: [{ name: "", type: "", values: "" }],
  productType: "",
  shippingWeightKg: "1,2506",
  shippingHeightCm: "10",
  shippingWidthCm: "25,5",
  shippingLengthCm: "30",
  shippingOriginPostalCode: "01310-100",
  shippingInsuranceValue: "",
  shippingDispatch: "oneDay",
  shippingOnDemandDays: "",
  shippingPackageSize: "custom",
  shippingMode: "integration",
  shippingExtraFee: "",
  shippingAutoTracking: true,
  shippingAutoAccept: false,
  shippingPickupAddress: "",
  shippingPickupHours: "",
  shippingCargoPrice: "",
  shippingCargoDays: "",
  pricingModel: "monthly",
  currency: "BRL",
  price: "1.890,00",
  setupFee: "500,5",
  stock: "",
  cancellationTerms: "30 dias corridos",
  validUntil: "2026-12-31",
  sponsored: true,
};

describe("toApiDecimal", () => {
  it.each([
    ["1.890,00", "1890.00"],
    ["0,29", "0.29"],
    ["800", "800.00"],
  ])("%j → %j", (input, expected) => {
    expect(toApiDecimal(input)).toBe(expected);
  });
});

describe("buildOfferingPayload", () => {
  it("monta os campos da oferta e guarda o resto em metadata", () => {
    const payload = buildOfferingPayload(BASE, "spec-1");

    expect(payload).toMatchObject({
      name: "Link Dedicado 1 Gbps",
      specificationId: "spec-1",
      monthlyPrice: "1890.00",
      installationPrice: "500.50",
      currency: "BRL",
      speed: "1 Gbps",
      // Exigido para publicar (MKT_OFFER_ACCEPTANCE_SLA_REQUIRED).
      acceptanceSlaHours: 48,
      cancellationTerms: "30 dias corridos",
    });
    expect(payload.metadata).toEqual({
      shortDescription: "Link simétrico com SLA",
      description: "x".repeat(60),
      technicalSlaPercent: 99.5,
      acceptanceSlaHours: 48,
      maxLatencyMs: 5,
      deliveryTime: "30 dias após o aceite",
      pricingModel: "monthly",
      currency: "BRL",
      cancellationTerms: "30 dias corridos",
      validUntil: "2026-12-31",
      serviceLocations: [
        {
          label: "Av. Dom Luís, 300, Caucaia - CE",
          longitude: -38.65,
          latitude: -3.73,
          radiusKm: "10",
        },
      ],
    });
  });

  it("atributos vão em `metadata.additionalProps`, com os valores em lista", () => {
    const payload = buildOfferingPayload(
      {
        ...BASE,
        attributes: [
          { name: " Velocidade ", type: "mbps", values: "100mbps, 500mbps," },
          { name: "", type: "", values: "" },
          { name: "Cor", type: "text", values: "Preto, Cinza, Preto" },
        ],
      },
      "spec-1",
    );

    expect(payload.metadata?.additionalProps).toEqual([
      { name: "Velocidade", type: "mbps", values: ["100mbps", "500mbps"] },
      { name: "Cor", type: "text", values: ["Preto", "Cinza"] },
    ]);
  });

  it("não envia categoria, região nem imagem", () => {
    const payload = buildOfferingPayload(
      { ...BASE, coverageRegion: "lacnic" },
      "spec-1",
    );
    const json = JSON.stringify(payload);

    expect(json).not.toContain("connectivity");
    expect(json).not.toContain("lacnic");
    expect(payload.metadata).not.toHaveProperty("images");
  });

  it("categoria com cobertura guarda as localidades com ponto e raio no metadata", () => {
    const payload = buildOfferingPayload(
      {
        ...BASE,
        locations: [
          ...BASE.locations,
          // Sem endereço escolhido: fica de fora.
          { label: "Digitado", longitude: null, latitude: null, radiusKm: "" },
        ],
      },
      "spec-1",
    );

    expect(payload.metadata?.serviceLocations).toEqual([
      {
        label: "Av. Dom Luís, 300, Caucaia - CE",
        longitude: -38.65,
        latitude: -3.73,
        radiusKm: "10",
      },
    ]);
    expect(
      buildOfferingPayload({ ...BASE, requiresCoverage: false }, "spec-1")
        .metadata,
    ).not.toHaveProperty("serviceLocations");
  });

  it("inclui os dados de Hardware só nessa categoria", () => {
    const payload = buildOfferingPayload(
      { ...BASE, category: "hardware", speedValue: "" },
      "spec-1",
    );

    expect(payload.speed).toBeNull();
    expect(payload.metadata).toMatchObject({
      hardware: { manufacturer: "Mikrotik", model: "RB4011", condition: "new" },
    });
    expect(payload.metadata).not.toHaveProperty("numbering");
  });

  it("Recursos Numéricos levam a documentação e descartam banda e latência", () => {
    const payload = buildOfferingPayload(
      { ...BASE, category: "numberingResources" },
      "spec-1",
    );

    expect(payload.speed).toBeNull();
    expect(payload.metadata).not.toHaveProperty("maxLatencyMs");
    expect(payload.metadata).toMatchObject({
      numbering: {
        resourceType: "ipv6",
        block: "/48",
        holder: "Cessão definitiva",
      },
    });
  });

  it("serviço sai como `service`, sem pacote de envio", () => {
    const payload = buildOfferingPayload(BASE, "spec-1");

    expect(payload.productType).toBe("service");
    expect(payload).not.toHaveProperty("shipping");
  });

  it("Hardware / CPE sai como `physical` com o pacote de envio", () => {
    const payload = buildOfferingPayload(
      { ...BASE, category: "hardware", shippingInsuranceValue: "1.200,00" },
      "spec-1",
    );

    expect(payload.productType).toBe("physical");
    expect(payload.shipping).toEqual({
      weightKg: 1.251,
      heightCm: 10,
      widthCm: 25.5,
      lengthCm: 30,
      originPostalCode: "01310100",
      postingDays: 1,
      packageSize: "custom",
      insuranceValue: 1200,
    });
    // Política de frete padrão: integração, sem acréscimo, com rastreio.
    expect(payload.metadata).toMatchObject({
      shippingPolicy: {
        mode: "integration",
        sellerMarkup: "0.00",
        freeShipping: false,
        pickup: false,
        pickupAddress: null,
        pickupHours: null,
        automaticTracking: true,
        autoAccept: false,
        cargoPrice: null,
        cargoDeliveryDays: null,
      },
    });
  });

  it("sob encomenda manda os dias informados em `postingDays`", () => {
    const payload = buildOfferingPayload(
      {
        ...BASE,
        category: "hardware",
        shippingDispatch: "onDemand",
        shippingOnDemandDays: "12",
        shippingPackageSize: "medium",
      },
      "spec-1",
    );

    expect(payload.shipping).toMatchObject({
      postingDays: 12,
      packageSize: "medium",
    });
  });

  it("frete de carga leva valor, prazo e acréscimo; retirada, endereço e horário", () => {
    const cargo = buildOfferingPayload(
      {
        ...BASE,
        category: "hardware",
        shippingMode: "cargo",
        shippingExtraFee: "5,00",
        shippingCargoPrice: "480,00",
        shippingCargoDays: "8",
        shippingPickupAddress: "Não vai",
      },
      "spec-1",
    );
    expect(cargo.metadata?.shippingPolicy).toMatchObject({
      mode: "cargo",
      sellerMarkup: "5.00",
      cargoPrice: "480.00",
      cargoDeliveryDays: 8,
      pickupAddress: null,
    });

    const pickup = buildOfferingPayload(
      {
        ...BASE,
        category: "hardware",
        shippingMode: "pickup",
        shippingExtraFee: "5,00",
        shippingPickupAddress: " Av. Santos Dumont, 3030 ",
        shippingPickupHours: "Seg a sex, 8h às 17h",
      },
      "spec-1",
    );
    expect(pickup.metadata?.shippingPolicy).toMatchObject({
      mode: "pickup",
      pickup: true,
      freeShipping: false,
      sellerMarkup: "0.00",
      pickupAddress: "Av. Santos Dumont, 3030",
      pickupHours: "Seg a sex, 8h às 17h",
      cargoPrice: null,
    });

    const free = buildOfferingPayload(
      { ...BASE, category: "hardware", shippingMode: "freeShipping" },
      "spec-1",
    );
    expect(free.metadata?.shippingPolicy).toMatchObject({
      mode: "free_shipping",
      freeShipping: true,
    });
  });

  it("serviço não leva política de frete", () => {
    const payload = buildOfferingPayload(BASE, "spec-1");

    expect(payload.metadata).not.toHaveProperty("shippingPolicy");
  });

  it("sem seguro, o pacote não leva `insuranceValue`", () => {
    const payload = buildOfferingPayload(
      { ...BASE, category: "hardware" },
      "spec-1",
    );

    expect(payload.shipping).not.toHaveProperty("insuranceValue");
  });

  it("estoque vai em `stockQuantity` só nas categorias com estoque numérico", () => {
    expect(
      buildOfferingPayload(
        { ...BASE, category: "hardware", hasNumericStock: true, stock: "25" },
        "s",
      ).stockQuantity,
    ).toBe(25);
    expect(
      buildOfferingPayload({ ...BASE, stock: "25" }, "s"),
    ).not.toHaveProperty("stockQuantity");
  });

  it("setup vazio vira zero e estoque preenchido vira número", () => {
    const payload = buildOfferingPayload(
      { ...BASE, setupFee: "", stock: "12" },
      "spec-1",
    );

    expect(payload.installationPrice).toBe("0.00");
    expect(payload.metadata).toMatchObject({ stock: 12 });
  });
});

describe("buildOfferingUpdate", () => {
  const OFFERING = { metadata: null } as ProductOffering;

  it("produto físico reenvia o pacote, sem `productType` quando o tipo não muda", () => {
    const payload = buildOfferingUpdate(
      { ...BASE, category: "hardware", productType: "physical" },
      "spec-1",
      { ...OFFERING, productType: "physical" },
    );

    expect(payload).not.toHaveProperty("productType");
    expect(payload.shipping).toMatchObject({ originPostalCode: "01310100" });
  });

  it("serviço que vira Hardware manda `productType: physical` com o pacote e a política", () => {
    const payload = buildOfferingUpdate(
      { ...BASE, category: "hardware", productType: "service" },
      "spec-1",
      { ...OFFERING, productType: "service" },
    );

    expect(payload.productType).toBe("physical");
    expect(payload.shipping).toMatchObject({ originPostalCode: "01310100" });
    expect(payload.metadata).toHaveProperty("shippingPolicy");
  });

  it("Hardware que vira outra categoria manda `productType: service`, sem pacote nem política", () => {
    const payload = buildOfferingUpdate(
      { ...BASE, category: "software", productType: "physical" },
      "spec-1",
      {
        ...OFFERING,
        productType: "physical",
        metadata: { shippingPolicy: { mode: "integration" }, extra: 1 },
      },
    );

    expect(payload.productType).toBe("service");
    expect(payload).not.toHaveProperty("shipping");
    expect(payload.metadata).not.toHaveProperty("shippingPolicy");
    // Chaves de outras telas continuam.
    expect(payload.metadata).toMatchObject({ extra: 1 });
  });

  it("regras do template vão em ruleValues só quando a categoria tem regras", () => {
    const rules = [
      {
        key: "fastActivation",
        name: "Ativação rápida",
        required: true,
        valueFields: [
          {
            key: "maxAcceptanceHours",
            label: "Horas",
            type: "number" as const,
            required: true,
          },
        ],
      },
    ];
    const values = {
      ...BASE,
      ruleValues: { fastActivation: { maxAcceptanceHours: "48" } },
    };
    expect(buildOfferingPayload(values, "s", rules).ruleValues).toEqual({
      fastActivation: { maxAcceptanceHours: 48 },
    });
    expect(buildOfferingPayload(values, "s")).not.toHaveProperty("ruleValues");
  });
});
