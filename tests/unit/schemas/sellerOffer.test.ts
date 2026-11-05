import { describe, expect, it } from "vitest";
import { ValidationError, type AnyObjectSchema } from "yup";

import { offerCategory, type OfferCategory } from "@/data/offerCategories";
import {
  OFFER_ATTRIBUTES_MAX,
  OFFER_IMAGE_MAX_BYTES,
  OFFER_INFRA_DETAILS_MAX,
  OFFER_INFRA_TEXT_MAX,
  OFFER_LOCATIONS_MAX,
  offerImageErrorKey,
  sellerOfferBasicInfoSchema,
  sellerOfferCoverageSchema,
  sellerOfferLogisticsSchema,
  sellerOfferPricingSchema,
  sellerOfferTechnicalSpecsSchema,
  type SellerOfferValidationContext,
} from "@/schemas/sellerOffer";

/**
 * Como escolher o card da família no assistente: grava o `categoryId` da
 * raiz e as flags dela (a menos que o teste informe os seus).
 */
function withRootSelection(
  values: Record<string, unknown>,
): Record<string, unknown> {
  const family = offerCategory(values.category as OfferCategory);
  if (!family || values.category === "custom") return values;
  return {
    categoryId: family.categoryId,
    requiresCoverage: family.requiresCoverage,
    hasNumericStock: !!family.hasNumericStock,
    ...values,
  };
}

async function validate(
  schema: AnyObjectSchema,
  values: Record<string, unknown>,
  context?: SellerOfferValidationContext,
): Promise<string[]> {
  try {
    await schema.validate(withRootSelection(values), {
      abortEarly: false,
      context,
    });
    return [];
  } catch (error) {
    if (error instanceof ValidationError) return error.errors;
    throw error;
  }
}

const errorsFor = (values: Record<string, unknown>) =>
  validate(sellerOfferCoverageSchema, values);

describe("sellerOfferCoverageSchema (etapa Categoria e cobertura)", () => {
  it("exige a categoria", async () => {
    expect(await errorsFor({ category: "" })).toContain(
      "SellerOfferCreate.errors.categoryRequired",
    );
  });

  it.each([
    "connectivity",
    "physicalInfra",
    "hardware",
    "numberingResources",
    "software",
    "protocols",
  ])(
    "não pede KMZ para %s: a cobertura é vinculada depois de criar",
    async (category) => {
      // Recursos Numéricos pedem só o registro (sem KMZ).
      const coverageRegion = category === "numberingResources" ? "lacnic" : "";
      expect(await errorsFor({ category, coverageRegion })).toEqual([]);
    },
  );

  describe("localidades de atendimento", () => {
    const POINT = { longitude: -38.5, latitude: -3.7 };
    const connectivity = { category: "connectivity" };
    const withLocations = (...locations: Record<string, unknown>[]) => ({
      ...connectivity,
      locations,
    });

    const BLANK = { label: "", longitude: null, latitude: null, radiusKm: "" };

    it.each(["connectivity", "physicalInfra"])(
      "em %s, a primeira (Localidade A do template) é obrigatória",
      async (category) => {
        expect(await errorsFor({ category, locations: [BLANK] })).toEqual([
          "SellerOfferCreate.errors.locationRequired",
        ]);
      },
    );

    it("as demais linhas são opcionais (linha em branco depois da primeira)", async () => {
      const ok = { ...POINT, label: "Fortaleza", radiusKm: "5" };
      expect(await errorsFor(withLocations(ok, BLANK))).toEqual([]);
    });

    it("exige escolher o endereço na lista (texto solto não vale)", async () => {
      expect(await errorsFor(withLocations({ label: "Av. Dom Luís" }))).toEqual(
        ["SellerOfferCreate.errors.locationSelect"],
      );
    });

    it("com o endereço escolhido, exige o raio entre 1 e 80 km", async () => {
      const located = { ...POINT, label: "Av. Dom Luís, Fortaleza" };

      expect(await errorsFor(withLocations(located))).toEqual([
        "SellerOfferCreate.errors.radiusRequired",
      ]);
      expect(
        await errorsFor(withLocations({ ...located, radiusKm: "0,5" })),
      ).toEqual(["SellerOfferCreate.errors.radiusRange"]);
      expect(
        await errorsFor(withLocations({ ...located, radiusKm: "80,5" })),
      ).toEqual(["SellerOfferCreate.errors.radiusRange"]);
      expect(
        await errorsFor(withLocations({ ...located, radiusKm: "1" })),
      ).toEqual([]);
      expect(
        await errorsFor(withLocations({ ...located, radiusKm: "80" })),
      ).toEqual([]);
    });

    it("valida cada localidade da lista", async () => {
      const ok = { ...POINT, label: "Fortaleza", radiusKm: "5" };
      expect(
        await errorsFor(withLocations(ok, { ...POINT, label: "Caucaia" }, ok)),
      ).toEqual(["SellerOfferCreate.errors.radiusRequired"]);
    });

    it(`aceita até ${OFFER_LOCATIONS_MAX} localidades`, async () => {
      const ok = { ...POINT, label: "Fortaleza", radiusKm: "5" };
      const many = Array.from({ length: OFFER_LOCATIONS_MAX + 1 }, () => ok);
      expect(await errorsFor(withLocations(...many))).toEqual([
        "SellerOfferCreate.errors.locationsMax",
      ]);
    });

    it("não valida a localidade nas categorias sem cobertura", async () => {
      expect(
        await errorsFor({
          category: "hardware",
          locations: [{ ...POINT, label: "Texto solto", radiusKm: "" }],
        }),
      ).toEqual([]);
      expect(
        await errorsFor({ category: "hardware", locations: [BLANK] }),
      ).toEqual([]);
    });
  });

  it("exige o registro dos recursos numéricos, entre as opções do template", async () => {
    expect(
      await errorsFor({ category: "numberingResources", coverageRegion: "" }),
    ).toEqual(["SellerOfferCreate.errors.regionRequired"]);
    expect(
      await errorsFor({
        category: "numberingResources",
        coverageRegion: "nic_br",
      }),
    ).toEqual([]);
    expect(
      await errorsFor({
        category: "numberingResources",
        coverageRegion: "LACNIC / Brasil",
      }),
    ).toHaveLength(1);
    // Fora de Recursos Numéricos o registro não é pedido.
    expect(
      await errorsFor({ category: "software", coverageRegion: "" }),
    ).toEqual([]);
  });
});

describe("sellerOfferBasicInfoSchema (etapa Informações básicas)", () => {
  const VALID = {
    name: "Bloco IPv6 /48",
    shortDescription: "Bloco /48 via LACNIC",
    description: "x".repeat(50),
  };
  const basicErrors = (values: Record<string, unknown>) =>
    validate(sellerOfferBasicInfoSchema, { ...VALID, ...values });

  it("aceita os dados válidos sem imagem", async () => {
    expect(await basicErrors({})).toEqual([]);
  });

  it("exige nome, descrição curta e descrição completa", async () => {
    const errors = await basicErrors({
      name: "  ",
      shortDescription: "",
      description: "",
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        "SellerOfferCreate.errors.nameRequired",
        "SellerOfferCreate.errors.shortDescriptionRequired",
        "SellerOfferCreate.errors.descriptionRequired",
      ]),
    );
    // Vazia também fica abaixo do mínimo, mas "obrigatória" vem antes — é o
    // primeiro erro que o formulário exibe.
    expect(errors.indexOf("SellerOfferCreate.errors.descriptionRequired")).toBe(
      errors.findIndex((message) => message.includes("description")),
    );
  });

  it("aplica os limites de tamanho do design", async () => {
    expect(await basicErrors({ name: "x".repeat(101) })).toEqual([
      "SellerOfferCreate.errors.nameTooLong",
    ]);
    expect(await basicErrors({ shortDescription: "x".repeat(161) })).toEqual([
      "SellerOfferCreate.errors.shortDescriptionTooLong",
    ]);
    // O mínimo de 50 conta sem os espaços das pontas.
    expect(await basicErrors({ description: ` ${"x".repeat(49)} ` })).toEqual([
      "SellerOfferCreate.errors.descriptionTooShort",
    ]);
  });
});

describe("offerImageErrorKey (fotos da oferta)", () => {
  const added = (file: File) => ({ kind: "new" as const, file });

  it("aceita JPG, PNG ou WEBP de até 5 MB", () => {
    const huge = new File(["png"], "grande.png", { type: "image/png" });
    Object.defineProperty(huge, "size", { value: OFFER_IMAGE_MAX_BYTES + 1 });

    expect(
      offerImageErrorKey(
        added(new File(["webp"], "a.webp", { type: "image/webp" })),
      ),
    ).toBeUndefined();
    expect(
      offerImageErrorKey(
        added(new File(["gif"], "a.gif", { type: "image/gif" })),
      ),
    ).toBe("SellerOfferCreate.errors.imageType");
    expect(offerImageErrorKey(added(huge))).toBe(
      "SellerOfferCreate.errors.imageSize",
    );
  });

  it("não revalida as fotos já salvas", () => {
    expect(
      offerImageErrorKey({ kind: "saved", id: "image-1", url: null }),
    ).toBeUndefined();
  });
});

describe("sellerOfferTechnicalSpecsSchema (etapa Especificações técnicas)", () => {
  // Software não tem velocidade obrigatória nem bloco de hardware.
  const VALID = {
    category: "software",
    speedValue: "",
    speedUnit: "Mbps",
    maxLatency: "",
    acceptanceSla: "48",
    technicalSla: "98,5",
    deliveryTime: "30 dias após o aceite",
  };
  const specsErrors = (values: Record<string, unknown>) =>
    validate(sellerOfferTechnicalSpecsSchema, { ...VALID, ...values });

  it("aceita os dados válidos sem velocidade fora de Conectividade", async () => {
    expect(await specsErrors({})).toEqual([]);
  });

  it("exige velocidade e IPs inclusos só para Conectividade", async () => {
    expect(await specsErrors({ category: "connectivity" })).toEqual([
      "SellerOfferCreate.errors.speedRequired",
      "SellerOfferCreate.errors.includedIpsRequired",
    ]);
    expect(
      await specsErrors({
        category: "connectivity",
        speedValue: "500",
        includedIps: "8",
      }),
    ).toEqual([]);
  });

  it("IPs inclusos é um inteiro (só dígitos)", async () => {
    expect(
      await specsErrors({
        category: "connectivity",
        speedValue: "500",
        includedIps: "8 IPs",
      }),
    ).toEqual(["SellerOfferCreate.errors.integerInvalid"]);
    expect(
      await specsErrors({
        category: "connectivity",
        speedValue: "500",
        includedIps: "0",
      }),
    ).toEqual([]);
  });

  it("recusa velocidade e latência que não são números positivos", async () => {
    expect(await specsErrors({ speedValue: "rápido" })).toEqual([
      "SellerOfferCreate.errors.speedInvalid",
    ]);
    expect(await specsErrors({ maxLatency: "0" })).toEqual([
      "SellerOfferCreate.errors.latencyInvalid",
    ]);
    expect(await specsErrors({ maxLatency: "2,5" })).toEqual([]);
  });

  it.each(["0", "73", "12,5", ""])(
    "recusa SLA de aceite %j (inteiro entre 1 e 72)",
    async (acceptanceSla) => {
      const errors = await specsErrors({ acceptanceSla });
      expect(errors[0]).toMatch(/SellerOfferCreate.errors.acceptanceSla/);
    },
  );

  it.each(["1", "72"])("aceita SLA de aceite %j", async (acceptanceSla) => {
    expect(await specsErrors({ acceptanceSla })).toEqual([]);
  });

  it("aceita SLA técnico com vírgula e %, até 100", async () => {
    expect(await specsErrors({ technicalSla: "99,95%" })).toEqual([]);
    expect(await specsErrors({ technicalSla: "100" })).toEqual([]);
    expect(await specsErrors({ technicalSla: "100,1" })).toEqual([
      "SellerOfferCreate.errors.technicalSlaRange",
    ]);
  });

  it("atributos são opcionais: linha vazia passa, linha começada exige os três campos", async () => {
    expect(
      await specsErrors({ attributes: [{ name: "", type: "", values: "" }] }),
    ).toEqual([]);
    expect(
      await specsErrors({
        attributes: [{ name: "Velocidade", type: "mbps", values: "100mbps" }],
      }),
    ).toEqual([]);
    expect(
      await specsErrors({
        attributes: [{ name: "Velocidade", type: "", values: " " }],
      }),
    ).toEqual([
      "SellerOfferCreate.errors.attributeTypeRequired",
      "SellerOfferCreate.errors.attributeValuesRequired",
    ]);
    expect(
      await specsErrors({
        attributes: [{ name: "", type: "text", values: "" }],
      }),
    ).toEqual([
      "SellerOfferCreate.errors.attributeNameRequired",
      "SellerOfferCreate.errors.attributeValuesRequired",
    ]);
  });

  it("atributos têm limite de tamanho, de tipo e de quantidade", async () => {
    expect(
      await specsErrors({
        attributes: [
          { name: "x".repeat(61), type: "outro", values: "y".repeat(501) },
        ],
      }),
    ).toEqual(
      expect.arrayContaining([
        "SellerOfferCreate.errors.attributeNameTooLong",
        "SellerOfferCreate.errors.attributeValuesTooLong",
      ]),
    );
    const row = { name: "Cor", type: "text", values: "Preto" };
    expect(
      await specsErrors({
        attributes: Array.from({ length: OFFER_ATTRIBUTES_MAX + 1 }, () => row),
      }),
    ).toEqual(["SellerOfferCreate.errors.attributesMax"]);
  });

  it("exige o prazo de entrega", async () => {
    expect(await specsErrors({ deliveryTime: " " })).toEqual([
      "SellerOfferCreate.errors.deliveryTimeRequired",
    ]);
  });
});

describe("sellerOfferTechnicalSpecsSchema · Hardware / CPE", () => {
  const BASE = {
    acceptanceSla: "48",
    technicalSla: "99",
    deliveryTime: "Pronta entrega",
  };
  const hardwareErrors = (values: Record<string, unknown>) =>
    validate(sellerOfferTechnicalSpecsSchema, { ...BASE, ...values });

  const DEVICE = {
    hardwareManufacturer: "Mikrotik",
    hardwareModel: "RB4011",
    hardwareCondition: "refurbished",
    hardwareWarranty: "12",
    hardwareSerialization: "yes",
  };
  it("exige fabricante, modelo, condição, garantia e serialização só para Hardware", async () => {
    expect(await hardwareErrors({ category: "hardware" })).toEqual([
      "SellerOfferCreate.errors.manufacturerRequired",
      "SellerOfferCreate.errors.modelRequired",
      "SellerOfferCreate.errors.conditionRequired",
      "SellerOfferCreate.errors.warrantyRequired",
      "SellerOfferCreate.errors.serializationRequired",
    ]);
    expect(await hardwareErrors({ category: "software" })).toEqual([]);
  });

  it("aceita Hardware completo, inclusive usado e não serializado", async () => {
    expect(await hardwareErrors({ category: "hardware", ...DEVICE })).toEqual(
      [],
    );
    expect(
      await hardwareErrors({
        category: "hardware",
        ...DEVICE,
        hardwareCondition: "used",
        hardwareSerialization: "no",
      }),
    ).toEqual([]);
  });

  it("garantia é em meses inteiros e serialização só aceita sim/não", async () => {
    expect(
      await hardwareErrors({
        category: "hardware",
        ...DEVICE,
        hardwareWarranty: "12 meses",
      }),
    ).toEqual(["SellerOfferCreate.errors.integerInvalid"]);
    expect(
      await hardwareErrors({
        category: "hardware",
        ...DEVICE,
        hardwareSerialization: "talvez",
      }),
    ).toHaveLength(1);
  });
});

describe("sellerOfferTechnicalSpecsSchema · Infra Física", () => {
  const BASE = {
    acceptanceSla: "48",
    technicalSla: "99",
    deliveryTime: "15 dias úteis",
  };
  const infraErrors = (values: Record<string, unknown>) =>
    validate(sellerOfferTechnicalSpecsSchema, { ...BASE, ...values });

  const INFRA = {
    infraCapacity: "48 portas",
    infraSoldUnit: "port",
    infraPowerSpacePort: "Energia redundante 48V, 2U no rack 3",
  };

  it("exige capacidade, unidade vendida e energia/espaço/porta só para Infra Física", async () => {
    expect(await infraErrors({ category: "physicalInfra" })).toEqual([
      "SellerOfferCreate.errors.capacityRequired",
      "SellerOfferCreate.errors.soldUnitRequired",
      "SellerOfferCreate.errors.powerSpacePortRequired",
    ]);
    expect(await infraErrors({ category: "software" })).toEqual([]);
  });

  it("aceita Infra Física completa", async () => {
    expect(await infraErrors({ category: "physicalInfra", ...INFRA })).toEqual(
      [],
    );
  });

  it("aplica os limites de tamanho e as unidades do template", async () => {
    expect(
      await infraErrors({
        category: "physicalInfra",
        ...INFRA,
        infraCapacity: "x".repeat(OFFER_INFRA_TEXT_MAX + 1),
        infraPowerSpacePort: "x".repeat(OFFER_INFRA_DETAILS_MAX + 1),
      }),
    ).toEqual([
      "SellerOfferCreate.errors.infraTooLong",
      "SellerOfferCreate.errors.infraTooLong",
    ]);
    expect(
      await infraErrors({
        category: "physicalInfra",
        ...INFRA,
        infraSoldUnit: "caixa",
      }),
    ).toHaveLength(1);
  });
});

describe("sellerOfferLogisticsSchema (etapa Logística, produto físico)", () => {
  const SHIPPING = {
    shippingWeightKg: "1,25",
    shippingHeightCm: "10",
    shippingWidthCm: "25",
    shippingLengthCm: "30",
    shippingOriginPostalCode: "01310-100",
  };
  const logisticsErrors = (values: Record<string, unknown>) =>
    validate(sellerOfferLogisticsSchema, values);

  it("exige o pacote e a origem só no produto físico", async () => {
    expect(await logisticsErrors({ category: "hardware" })).toEqual([
      "SellerOfferCreate.errors.weightRequired",
      "SellerOfferCreate.errors.heightRequired",
      "SellerOfferCreate.errors.widthRequired",
      "SellerOfferCreate.errors.lengthRequired",
      "SellerOfferCreate.errors.postalCodeRequired",
    ]);
    expect(await logisticsErrors({ category: "software" })).toEqual([]);
  });

  it("aceita o pacote completo, com seguro e acréscimo opcionais", async () => {
    expect(
      await logisticsErrors({ category: "hardware", ...SHIPPING }),
    ).toEqual([]);
    expect(
      await logisticsErrors({
        category: "hardware",
        ...SHIPPING,
        shippingExtraFee: "0,00",
      }),
    ).toEqual([]);
  });

  it("aplica os limites do pacote de envio da marketplace-api", async () => {
    expect(
      await logisticsErrors({
        category: "hardware",
        ...SHIPPING,
        shippingWeightKg: "1000,5",
        shippingHeightCm: "0",
        shippingLengthCm: "401",
        shippingOriginPostalCode: "00000-000",
        shippingInsuranceValue: "0",
        shippingExtraFee: "1,999",
        // Acima do limite de mercado: só carga ou a combinar.
        shippingMode: "cargo",
      }),
    ).toEqual([
      "SellerOfferCreate.errors.weightRange",
      "SellerOfferCreate.errors.sideRange",
      "SellerOfferCreate.errors.sideRange",
      "SellerOfferCreate.errors.postalCodeInvalid",
      "SellerOfferCreate.errors.insuranceInvalid",
      "SellerOfferCreate.errors.extraFeeInvalid",
    ]);
  });

  it("o tipo acompanha a categoria: serviço que vira Hardware passa a exigir o envio", async () => {
    expect(
      await logisticsErrors({ category: "hardware", productType: "service" }),
    ).toContain("SellerOfferCreate.errors.weightRequired");
    expect(
      await logisticsErrors({ category: "software", productType: "physical" }),
    ).toEqual([]);
    // Sem categoria reconhecida, vale o tipo salvo.
    expect(
      await logisticsErrors({ category: "", productType: "physical" }),
    ).toContain("SellerOfferCreate.errors.weightRequired");
  });

  it("prazo de postagem, tamanho e modalidade têm padrão e só aceitam as opções", async () => {
    expect(sellerOfferLogisticsSchema.getDefault()).toMatchObject({
      shippingDispatch: "oneDay",
      shippingPackageSize: "custom",
      shippingMode: "integration",
      shippingAutoTracking: true,
    });
    expect(
      await logisticsErrors({
        category: "hardware",
        ...SHIPPING,
        shippingDispatch: "nextWeek",
      }),
    ).toHaveLength(1);
  });

  it("sob encomenda exige de 4 a 30 dias úteis", async () => {
    const onDemand = (days: string) =>
      logisticsErrors({
        category: "hardware",
        ...SHIPPING,
        shippingDispatch: "onDemand",
        shippingOnDemandDays: days,
      });

    expect(await onDemand("")).toEqual([
      "SellerOfferCreate.errors.onDemandDaysRange",
    ]);
    expect(await onDemand("3")).toEqual([
      "SellerOfferCreate.errors.onDemandDaysRange",
    ]);
    expect(await onDemand("31")).toEqual([
      "SellerOfferCreate.errors.onDemandDaysRange",
    ]);
    expect(await onDemand("12")).toEqual([]);
  });

  it("o tamanho pronto precisa caber no peso máximo e no limite de mercado", async () => {
    expect(
      await logisticsErrors({
        category: "hardware",
        ...SHIPPING,
        shippingPackageSize: "small",
        shippingWeightKg: "1,5",
      }),
    ).toEqual(["SellerOfferCreate.errors.packageSizeMismatch"]);
    expect(
      await logisticsErrors({
        category: "hardware",
        ...SHIPPING,
        shippingPackageSize: "medium",
        shippingWeightKg: "4",
      }),
    ).toEqual([]);
  });

  it("Carga é só acima do limite, e aí a modalidade é carga ou a combinar", async () => {
    expect(
      await logisticsErrors({
        category: "hardware",
        ...SHIPPING,
        shippingPackageSize: "cargo",
      }),
    ).toEqual(["SellerOfferCreate.errors.cargoWithinLimit"]);

    const big = {
      category: "hardware",
      ...SHIPPING,
      shippingPackageSize: "cargo",
      shippingWeightKg: "45",
      shippingHeightCm: "120",
    };
    expect(await logisticsErrors(big)).toEqual([
      "SellerOfferCreate.errors.shippingModeInvalid",
    ]);
    expect(
      await logisticsErrors({ ...big, shippingMode: "toBeAgreed" }),
    ).toEqual([]);
  });

  it("valor e prazo do frete de carga vão juntos", async () => {
    const cargo = {
      category: "hardware",
      ...SHIPPING,
      shippingWeightKg: "45",
      shippingMode: "cargo",
    };
    expect(
      await logisticsErrors({ ...cargo, shippingCargoPrice: "480,00" }),
    ).toEqual(["SellerOfferCreate.errors.cargoDaysRequired"]);
    expect(
      await logisticsErrors({ ...cargo, shippingCargoDays: "91" }),
    ).toEqual([
      "SellerOfferCreate.errors.cargoPriceRequired",
      "SellerOfferCreate.errors.cargoDaysRange",
    ]);
    expect(
      await logisticsErrors({
        ...cargo,
        shippingCargoPrice: "480,00",
        shippingCargoDays: "8",
      }),
    ).toEqual([]);
  });
});

describe("sellerOfferPricingSchema (etapa Preço e disponibilidade)", () => {
  const VALID = {
    pricingModel: "monthly",
    currency: "BRL",
    price: "1.890,00",
    setupFee: "",
    stock: "",
    cancellationTerms: "30 dias corridos sem multa",
    validUntil: "",
    sponsored: false,
  };
  const pricingErrors = (values: Record<string, unknown>) =>
    validate(sellerOfferPricingSchema, { ...VALID, ...values });

  it("aceita os dados válidos", async () => {
    expect(await pricingErrors({})).toEqual([]);
  });

  it("exige modelo de preço, preço e cancelamento", async () => {
    expect(
      await pricingErrors({
        pricingModel: "",
        price: "",
        cancellationTerms: "",
      }),
    ).toEqual(
      expect.arrayContaining([
        "SellerOfferCreate.errors.pricingModelRequired",
        "SellerOfferCreate.errors.priceRequired",
        "SellerOfferCreate.errors.cancellationRequired",
      ]),
    );
  });

  it.each(["0,29", "99.9", "1.890,00", "800"])(
    "aceita o preço %j",
    async (price) => {
      expect(await pricingErrors({ price })).toEqual([]);
    },
  );

  it.each(["0", "-10", "1,999", "abc"])("recusa o preço %j", async (price) => {
    expect(await pricingErrors({ price })).toEqual([
      "SellerOfferCreate.errors.priceInvalid",
    ]);
  });

  it("aceita setup zero e recusa negativo", async () => {
    expect(await pricingErrors({ setupFee: "0" })).toEqual([]);
    expect(await pricingErrors({ setupFee: "-1" })).toEqual([
      "SellerOfferCreate.errors.setupInvalid",
    ]);
  });

  it("aceita estoque vazio ou inteiro", async () => {
    expect(await pricingErrors({ stock: "2" })).toEqual([]);
    expect(await pricingErrors({ stock: "2,5" })).toEqual([
      "SellerOfferCreate.errors.stockInvalid",
    ]);
  });

  it.each(["hardware", "numberingResources"])(
    "exige o estoque em %s (publica com stockQuantity)",
    async (category) => {
      expect(await pricingErrors({ category, stock: "" })).toEqual([
        "SellerOfferCreate.errors.stockRequired",
      ]);
      expect(await pricingErrors({ category, stock: "10" })).toEqual([]);
    },
  );

  it("não exige o estoque nas categorias sem estoque numérico", async () => {
    expect(
      await pricingErrors({ category: "connectivity", stock: "" }),
    ).toEqual([]);
  });

  it("recusa vigência no passado", async () => {
    expect(await pricingErrors({ validUntil: "2000-01-01" })).toEqual([
      "SellerOfferCreate.errors.validUntilPast",
    ]);
    expect(await pricingErrors({ validUntil: "2999-12-31" })).toEqual([]);
  });
});

describe("sellerOfferTechnicalSpecsSchema · Recursos Numéricos", () => {
  const BASE = {
    acceptanceSla: "72",
    technicalSla: "99",
    deliveryTime: "5 dias úteis",
  };
  const numberingErrors = (values: Record<string, unknown>) =>
    validate(sellerOfferTechnicalSpecsSchema, { ...BASE, ...values });

  it("exige tipo, bloco e titularidade só para Recursos Numéricos", async () => {
    expect(await numberingErrors({ category: "numberingResources" })).toEqual([
      "SellerOfferCreate.errors.numberingTypeRequired",
      "SellerOfferCreate.errors.numberingBlockRequired",
      "SellerOfferCreate.errors.numberingHolderRequired",
    ]);
    expect(await numberingErrors({ category: "hardware" })).not.toContain(
      "SellerOfferCreate.errors.numberingTypeRequired",
    );
  });

  it("aceita a documentação completa", async () => {
    expect(
      await numberingErrors({
        category: "numberingResources",
        numberingResourceType: "ipv6",
        numberingBlock: "1 bloco /48",
        numberingHolder: "LACNIC · transferência com suporte",
      }),
    ).toEqual([]);
  });

  it("o tipo só aceita as opções do template", async () => {
    expect(
      await numberingErrors({
        category: "numberingResources",
        numberingResourceType: "IPv6 /48",
        numberingBlock: "1 bloco /48",
        numberingHolder: "LACNIC · transferência com suporte",
      }),
    ).toHaveLength(1);
  });
});

describe("templateValues (campos genéricos do template)", () => {
  const context: SellerOfferValidationContext = {
    templateFields: [
      {
        key: "capacityKva",
        label: "Capacidade",
        type: "number_with_unit",
        unit: "kVA",
        required: true,
        min: 1,
      },
      {
        key: "technology",
        label: "Tecnologia",
        type: "single_choice",
        required: false,
        options: ["fiber", "radio"],
      },
    ],
  };
  const specsErrorsWith = (values: Record<string, unknown>) =>
    validate(sellerOfferTechnicalSpecsSchema, values, context);

  it("valida cada campo pelo tipo e pelas regras do template", async () => {
    const errors = await specsErrorsWith({
      category: "custom",
      templateValues: { capacityKva: "0", technology: "copper" },
    });
    expect(errors).toContain("SellerOfferCreate.errors.templateRange");
    expect(errors).toContain("SellerOfferCreate.errors.templateChoice");
  });

  it("exige os obrigatórios e passa com os valores válidos", async () => {
    expect(
      await specsErrorsWith({ category: "custom", templateValues: {} }),
    ).toContain("SellerOfferCreate.errors.templateRequired");
    expect(
      await specsErrorsWith({
        category: "custom",
        templateValues: { capacityKva: "12,5", technology: "fiber" },
      }),
    ).not.toEqual(
      expect.arrayContaining([expect.stringMatching(/errors\.template/)]),
    );
  });

  it("sem campos no contexto, não valida nada do template", async () => {
    expect(
      await validate(sellerOfferTechnicalSpecsSchema, {
        category: "custom",
        templateValues: { capacityKva: "x" },
      }),
    ).not.toEqual(
      expect.arrayContaining([expect.stringMatching(/errors\.template/)]),
    );
  });
});

describe("categoria escolhida na API", () => {
  it("exige o categoryId quando há categoria", async () => {
    expect(
      await errorsFor({ category: "software", categoryId: "" }),
    ).toContain("SellerOfferCreate.errors.categoryRequired");
  });

  it("subcategoria de Conectividade sem cobertura não pede a localidade", async () => {
    expect(
      await errorsFor({
        category: "connectivity",
        categoryId: "0193a000-0000-7000-8000-0000000000d2",
        requiresCoverage: false,
        locations: [{ label: "", longitude: null, latitude: null, radiusKm: "" }],
      }),
    ).toEqual([]);
  });
});

describe("ruleValues (regras condicionais do template)", () => {
  const context: SellerOfferValidationContext = {
    rules: [
      {
        key: "fastActivation",
        name: "Ativação rápida",
        required: true,
        valueFields: [
          {
            key: "maxAcceptanceHours",
            label: "Horas",
            type: "number",
            required: false,
            min: 1,
            max: 72,
          },
        ],
      },
    ],
  };

  it("regra obrigatória vazia trava a etapa; preenchida passa", async () => {
    expect(
      await validate(
        sellerOfferTechnicalSpecsSchema,
        { category: "software", ruleValues: {} },
        context,
      ),
    ).toContain("SellerOfferCreate.errors.templateRequired");
    expect(
      await validate(
        sellerOfferTechnicalSpecsSchema,
        {
          category: "software",
          ruleValues: { fastActivation: { maxAcceptanceHours: "24" } },
        },
        context,
      ),
    ).not.toEqual(
      expect.arrayContaining([expect.stringMatching(/errors\.template/)]),
    );
  });
});
