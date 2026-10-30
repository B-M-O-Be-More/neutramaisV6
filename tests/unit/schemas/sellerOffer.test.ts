import { describe, expect, it } from "vitest";
import { ValidationError, type AnyObjectSchema } from "yup";

import {
  OFFER_IMAGE_MAX_BYTES,
  OFFER_LOCATIONS_MAX,
  offerImageErrorKey,
  sellerOfferBasicInfoSchema,
  sellerOfferCoverageSchema,
  sellerOfferPricingSchema,
  sellerOfferTechnicalSpecsSchema,
} from "@/schemas/sellerOffer";

async function validate(
  schema: AnyObjectSchema,
  values: Record<string, unknown>,
): Promise<string[]> {
  try {
    await schema.validate(values, { abortEarly: false });
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
      expect(await errorsFor({ category })).toEqual([]);
    },
  );

  describe("localidades de atendimento", () => {
    const POINT = { longitude: -38.5, latitude: -3.7 };
    const connectivity = { category: "connectivity" };
    const withLocations = (...locations: Record<string, unknown>[]) => ({
      ...connectivity,
      locations,
    });

    it("são opcionais (lista vazia ou linha em branco)", async () => {
      expect(await errorsFor(connectivity)).toEqual([]);
      expect(
        await errorsFor(
          withLocations({
            label: "",
            longitude: null,
            latitude: null,
            radiusKm: "",
          }),
        ),
      ).toEqual([]);
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
    });
  });

  it("aceita a região de recursos numéricos opcional, até 120 caracteres", async () => {
    expect(
      await errorsFor({ category: "numberingResources", coverageRegion: "" }),
    ).toEqual([]);
    expect(
      await errorsFor({
        category: "numberingResources",
        coverageRegion: "x".repeat(121),
      }),
    ).toEqual(["SellerOfferCreate.errors.locationTooLong"]);
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

  it("exige velocidade só para Conectividade", async () => {
    expect(await specsErrors({ category: "connectivity" })).toEqual([
      "SellerOfferCreate.errors.speedRequired",
    ]);
    expect(
      await specsErrors({ category: "connectivity", speedValue: "500" }),
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
  };
  const SHIPPING = {
    shippingWeightKg: "1,25",
    shippingHeightCm: "10",
    shippingWidthCm: "25",
    shippingLengthCm: "30",
    shippingOriginPostalCode: "01310-100",
  };

  it("exige fabricante, modelo, condição e o envio só para Hardware", async () => {
    expect(await hardwareErrors({ category: "hardware" })).toEqual([
      "SellerOfferCreate.errors.manufacturerRequired",
      "SellerOfferCreate.errors.modelRequired",
      "SellerOfferCreate.errors.conditionRequired",
      "SellerOfferCreate.errors.weightRequired",
      "SellerOfferCreate.errors.heightRequired",
      "SellerOfferCreate.errors.widthRequired",
      "SellerOfferCreate.errors.lengthRequired",
      "SellerOfferCreate.errors.postalCodeRequired",
    ]);
    expect(await hardwareErrors({ category: "software" })).toEqual([]);
  });

  it("aceita Hardware completo, com garantia, serialização e seguro opcionais", async () => {
    expect(
      await hardwareErrors({ category: "hardware", ...DEVICE, ...SHIPPING }),
    ).toEqual([]);
  });

  it("aplica os limites do pacote de envio da marketplace-api", async () => {
    expect(
      await hardwareErrors({
        category: "hardware",
        ...DEVICE,
        ...SHIPPING,
        shippingWeightKg: "1000,5",
        shippingHeightCm: "0",
        shippingLengthCm: "401",
        shippingOriginPostalCode: "00000-000",
        shippingInsuranceValue: "0",
      }),
    ).toEqual([
      "SellerOfferCreate.errors.weightRange",
      "SellerOfferCreate.errors.sideRange",
      "SellerOfferCreate.errors.sideRange",
      "SellerOfferCreate.errors.postalCodeInvalid",
      "SellerOfferCreate.errors.insuranceInvalid",
    ]);
  });

  it("na edição vale o tipo salvo: Hardware criado como serviço não exige envio", async () => {
    expect(
      await hardwareErrors({
        category: "hardware",
        productType: "service",
        ...DEVICE,
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
        numberingResourceType: "IPv6 /48",
        numberingBlock: "1 bloco /48",
        numberingHolder: "LACNIC · transferência com suporte",
      }),
    ).toEqual([]);
  });
});
