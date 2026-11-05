import { describe, expect, it } from "vitest";

import { buildSpecificationPayload } from "@/functions/buildSpecificationPayload";
import {
  SELLER_OFFER_DEFAULTS,
  type SellerOfferValues,
} from "@/schemas/sellerOffer";

const values = (patch: Partial<SellerOfferValues>): SellerOfferValues => ({
  ...SELLER_OFFER_DEFAULTS,
  ...patch,
});

const location = (label: string) => ({
  label,
  longitude: -46.65,
  latitude: -23.56,
  radiusKm: "5",
});

describe("buildSpecificationPayload", () => {
  it("Conectividade: banda em Mbps, SLA, localidades A/Z e IPs", () => {
    expect(
      buildSpecificationPayload(
        values({
          category: "connectivity",
          speedValue: "1",
          speedUnit: "Gbps",
          technicalSla: "99,5",
          includedIps: "8",
          locations: [
            location(" Av. Paulista, 1000 "),
            location("Praça da Sé"),
          ],
        }),
      ),
    ).toEqual({
      name: "Conectividade",
      categoryId: "0193a000-0000-7000-8000-000000000c01",
      characteristics: {
        bandwidthMbps: 1000,
        technicalSlaPercent: 99.5,
        locationA: "Av. Paulista, 1000",
        locationZ: "Praça da Sé",
        includedIps: 8,
      },
    });
  });

  it("Infra Física: localidade, capacidade, unidade e energia/espaço/porta", () => {
    expect(
      buildSpecificationPayload(
        values({
          category: "physicalInfra",
          locations: [location("Rua Direita, 250")],
          infraCapacity: "2U",
          infraSoldUnit: "rack_unit",
          infraPowerSpacePort: "2 kW, porta 10G",
        }),
      ).characteristics,
    ).toEqual({
      location: "Rua Direita, 250",
      capacity: "2U",
      soldUnit: "rack_unit",
      powerSpacePort: "2 kW, porta 10G",
    });
  });

  it("Hardware: garantia vira número e serializado vira booleano", () => {
    expect(
      buildSpecificationPayload(
        values({
          category: "hardware",
          hardwareManufacturer: "Mikrotik",
          hardwareModel: "RB4011",
          hardwareCondition: "used",
          hardwareWarranty: "12",
          hardwareSerialization: "no",
        }),
      ).characteristics,
    ).toEqual({
      manufacturer: "Mikrotik",
      model: "RB4011",
      condition: "used",
      warrantyMonths: 12,
      serialized: false,
    });
  });

  it("Recursos Numéricos: titularidade vira `allowedUse` e o registro vem da etapa 1", () => {
    expect(
      buildSpecificationPayload(
        values({
          category: "numberingResources",
          numberingResourceType: "ipv4",
          numberingBlock: "/24",
          numberingHolder: "Cessão definitiva",
          coverageRegion: "lacnic",
        }),
      ).characteristics,
    ).toEqual({
      resourceType: "ipv4",
      block: "/24",
      allowedUse: "Cessão definitiva",
      registry: "lacnic",
    });
  });

  it("categorias sem campo obrigatório mandam `characteristics` vazio", () => {
    expect(
      buildSpecificationPayload(values({ category: "protocols" })),
    ).toEqual({
      name: "Protocolos e Serviços",
      categoryId: "0193a000-0000-7000-8000-000000000c06",
      characteristics: {},
    });
  });

  it("subcategoria: vai na categoria escolhida, com o nome dela e os campos genéricos", () => {
    expect(
      buildSpecificationPayload(
        values({
          category: "connectivity",
          categoryId: "0193a000-0000-7000-8000-0000000000d1",
          categoryLabel: "Conectividade › Link dedicado",
          speedValue: "500",
          technicalSla: "99,9",
          includedIps: "4",
          locations: [location("Av. Paulista, 1000")],
          templateValues: { technology: "fiber", symmetric: "true" },
        }),
        [
          {
            key: "technology",
            label: "Tecnologia",
            type: "single_choice",
            required: false,
            options: ["fiber", "radio"],
          },
          { key: "symmetric", label: "Simetria", type: "boolean", required: false },
        ],
      ),
    ).toEqual({
      name: "Link dedicado",
      categoryId: "0193a000-0000-7000-8000-0000000000d1",
      characteristics: {
        bandwidthMbps: 500,
        technicalSlaPercent: 99.9,
        locationA: "Av. Paulista, 1000",
        includedIps: 4,
        technology: "fiber",
        symmetric: true,
      },
    });
  });

  it("categoria nova (custom): só os campos do template", () => {
    expect(
      buildSpecificationPayload(
        values({
          category: "custom",
          categoryId: "0193a000-0000-7000-8000-0000000000e1",
          categoryLabel: "Energia",
          templateValues: { capacityKva: "12,5" },
        }),
        [
          {
            key: "capacityKva",
            label: "Capacidade",
            type: "number_with_unit",
            unit: "kVA",
            required: true,
          },
        ],
      ),
    ).toEqual({
      name: "Energia",
      categoryId: "0193a000-0000-7000-8000-0000000000e1",
      characteristics: { capacityKva: 12.5 },
    });
  });
});
