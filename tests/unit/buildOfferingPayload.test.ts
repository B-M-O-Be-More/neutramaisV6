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
  numberingResourceType: "IPv6",
  numberingBlock: "/48",
  numberingHolder: "LACNIC",
  productType: "",
  shippingWeightKg: "1,2506",
  shippingHeightCm: "10",
  shippingWidthCm: "25,5",
  shippingLengthCm: "30",
  shippingOriginPostalCode: "01310-100",
  shippingInsuranceValue: "",
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
      speed: "1 Gbps",
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
    });
  });

  it("não envia categoria, localidade, região nem imagem", () => {
    const payload = buildOfferingPayload(
      { ...BASE, coverageRegion: "Brasil (LACNIC)" },
      "spec-1",
    );
    const json = JSON.stringify(payload);

    expect(json).not.toContain("connectivity");
    expect(json).not.toContain("Caucaia");
    expect(json).not.toContain("-38.65");
    expect(json).not.toContain("LACNIC");
    expect(payload.metadata).not.toHaveProperty("images");
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
      numbering: { resourceType: "IPv6", block: "/48", holder: "LACNIC" },
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
      insuranceValue: 1200,
    });
  });

  it("sem seguro, o pacote não leva `insuranceValue`", () => {
    const payload = buildOfferingPayload(
      { ...BASE, category: "hardware" },
      "spec-1",
    );

    expect(payload.shipping).not.toHaveProperty("insuranceValue");
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

  it("produto físico reenvia o pacote, sem `productType` (fixo na criação)", () => {
    const payload = buildOfferingUpdate(
      { ...BASE, category: "hardware", productType: "physical" },
      "spec-1",
      OFFERING,
    );

    expect(payload).not.toHaveProperty("productType");
    expect(payload.shipping).toMatchObject({ originPostalCode: "01310100" });
  });

  it("oferta salva como serviço não manda pacote, mesmo em Hardware", () => {
    const payload = buildOfferingUpdate(
      { ...BASE, category: "hardware", productType: "service" },
      "spec-1",
      OFFERING,
    );

    expect(payload).not.toHaveProperty("shipping");
  });
});
