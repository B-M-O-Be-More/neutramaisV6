import * as yup from "yup";

import {
  OFFER_CATEGORIES,
  offerCategory,
  type OfferCategory,
} from "@/data/offerCategories";
import { parseDecimal } from "@/functions/parseDecimal";
import { todayIso } from "@/functions/todayIso";

/* ---------------------------------------------------------------------------
 * Criação de oferta do seller — assistente em 5 etapas (Figma 2664-55368),
 * um schema por etapa combinados em `sellerOfferSchema`.
 * As mensagens são CHAVES de tradução (SellerOfferCreate.errors.*), traduzidas
 * na exibição.
 * ------------------------------------------------------------------------- */

/**
 * Raio da localidade de atendimento, em km. A busca de POPs da geo-api
 * (`POST /networkPoint/nearby`) recebe o mesmo raio, em metros.
 */
export const OFFER_LOCATION_RADIUS_MIN_KM = 1;
export const OFFER_LOCATION_RADIUS_MAX_KM = 80;
/** Quantas localidades de atendimento a oferta aceita. */
export const OFFER_LOCATIONS_MAX = 10;

/**
 * Recorte da cobertura ("Escolher cobertura"): toda a área do KMZ ou um
 * polígono desenhado pelo seller (Figma 2697-43374 / 2697-43449).
 */
export const COVERAGE_SCOPE_MODES = ["full", "custom"] as const;
export type CoverageScopeMode = (typeof COVERAGE_SCOPE_MODES)[number];

/** A localidade só existe nas categorias com cobertura. */
function locationApplies(parent: { category?: OfferCategory | "" }): boolean {
  return !!offerCategory(parent.category)?.requiresCoverage;
}

function hasCoordinates(location: {
  longitude?: number | null;
  latitude?: number | null;
}): boolean {
  return (
    typeof location.longitude === "number" &&
    typeof location.latitude === "number"
  );
}

/**
 * Valores da raiz do formulário dentro de um item da lista de localidades
 * (`context.from` vai do item até a raiz).
 */
function rootOf(context: yup.TestContext): { category?: OfferCategory | "" } {
  return context.from?.[context.from.length - 1]?.value ?? {};
}

/** Uma localidade: endereço escolhido nas sugestões do Mapbox + raio. */
export const offerLocationSchema = yup.object({
  label: yup
    .string()
    .trim()
    .max(255, "SellerOfferCreate.errors.locationTooLong")
    .default("")
    .test(
      "location-selected",
      "SellerOfferCreate.errors.locationSelect",
      (value, context) =>
        !locationApplies(rootOf(context)) ||
        !value ||
        hasCoordinates(context.parent),
    ),
  longitude: yup.number().nullable().default(null),
  latitude: yup.number().nullable().default(null),
  radiusKm: yup
    .string()
    .trim()
    .default("")
    .test(
      "radius-required",
      "SellerOfferCreate.errors.radiusRequired",
      (value, context) =>
        !locationApplies(rootOf(context)) ||
        !hasCoordinates(context.parent) ||
        !!value,
    )
    .test(
      "radius-range",
      "SellerOfferCreate.errors.radiusRange",
      (value, context) => {
        if (!locationApplies(rootOf(context)) || !value) return true;
        const radius = parseDecimal(value);
        return (
          radius !== null &&
          radius >= OFFER_LOCATION_RADIUS_MIN_KM &&
          radius <= OFFER_LOCATION_RADIUS_MAX_KM
        );
      },
    ),
});

export type OfferLocation = yup.InferType<typeof offerLocationSchema>;

/** Localidade em branco — uma linha nova da lista. */
export const EMPTY_OFFER_LOCATION: OfferLocation = {
  label: "",
  longitude: null,
  latitude: null,
  radiusKm: "",
};

/**
 * Etapa 1 — Categoria. A cobertura (KMZ e recorte público) não faz parte do
 * formulário: só é vinculada depois da oferta criada, na área de cobertura
 * da edição (`useOfferingCoverageEditor`), e só nas categorias com KMZ.
 */
export const sellerOfferCoverageSchema = yup.object({
  category: yup
    .mixed<OfferCategory | "">()
    .oneOf(
      OFFER_CATEGORIES.map((category) => category.key),
      "SellerOfferCreate.errors.categoryRequired",
    )
    .required("SellerOfferCreate.errors.categoryRequired"),
  // Localidades de atendimento (A/Z): uma ou mais, cada uma com endereço e
  // raio. Opcionais e só no fluxo com cobertura (Conectividade e Infra
  // Física) — nas demais categorias o campo some e não é validado.
  locations: yup
    .array()
    .of(offerLocationSchema)
    .max(OFFER_LOCATIONS_MAX, "SellerOfferCreate.errors.locationsMax")
    .default([]),
  // Abrangência sem KMZ, ex.: recursos numéricos por região/registro.
  coverageRegion: yup
    .string()
    .trim()
    .max(120, "SellerOfferCreate.errors.locationTooLong")
    .default(""),
});

/** Limites da etapa 2 (Figma 2073-44741). */
export const OFFER_NAME_MAX = 100;
export const OFFER_SHORT_DESCRIPTION_MAX = 160;
export const OFFER_DESCRIPTION_MIN = 50;
export const OFFER_DESCRIPTION_MAX = 5000;
/** Limites das imagens da oferta na marketplace-api. */
export const OFFER_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const OFFER_IMAGES_MAX = 10;
export const OFFER_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Foto da oferta na área de fotos da edição: já confirmada (`saved`) ou
 * escolhida agora (`new`). Só existe para oferta já criada — o assistente de
 * criação não tem fotos. A primeira da lista é a capa.
 */
export type OfferImageItem =
  | { kind: "saved"; id: string; url: string | null }
  | { kind: "new"; file: File };

/** Erro (chave de tradução) de uma foto escolhida; as salvas já valeram. */
export function offerImageErrorKey(item: OfferImageItem): string | undefined {
  if (item.kind === "saved") return undefined;
  if (!OFFER_IMAGE_TYPES.includes(item.file.type)) {
    return "SellerOfferCreate.errors.imageType";
  }
  if (item.file.size > OFFER_IMAGE_MAX_BYTES) {
    return "SellerOfferCreate.errors.imageSize";
  }
  return undefined;
}

/**
 * Etapa 2 — Informações básicas. O nome vai em `name` e as descrições em
 * `metadata`.
 */
export const sellerOfferBasicInfoSchema = yup.object({
  name: yup
    .string()
    .trim()
    .required("SellerOfferCreate.errors.nameRequired")
    .max(OFFER_NAME_MAX, "SellerOfferCreate.errors.nameTooLong")
    .default(""),
  shortDescription: yup
    .string()
    .trim()
    .required("SellerOfferCreate.errors.shortDescriptionRequired")
    .max(
      OFFER_SHORT_DESCRIPTION_MAX,
      "SellerOfferCreate.errors.shortDescriptionTooLong",
    )
    .default(""),
  description: yup
    .string()
    .trim()
    .required("SellerOfferCreate.errors.descriptionRequired")
    .min(OFFER_DESCRIPTION_MIN, "SellerOfferCreate.errors.descriptionTooShort")
    .max(OFFER_DESCRIPTION_MAX, "SellerOfferCreate.errors.descriptionTooLong")
    .default(""),
});

/** Unidades de velocidade/banda (a API guarda o texto, ex.: "500 Mbps"). */
export const OFFER_SPEED_UNITS = ["Mbps", "Gbps"] as const;
export type OfferSpeedUnit = (typeof OFFER_SPEED_UNITS)[number];

/** SLA de aceite em horas (Figma 2073-48148): entre 1 e 72, padrão 48. */
export const OFFER_ACCEPTANCE_SLA_MIN = 1;
export const OFFER_ACCEPTANCE_SLA_MAX = 72;
export const OFFER_ACCEPTANCE_SLA_DEFAULT = "48";
export const OFFER_DELIVERY_TIME_MAX = 120;

/** Condição do equipamento (Hardware / CPE). */
export const HARDWARE_CONDITIONS = ["new", "refurbished"] as const;
export type HardwareCondition = (typeof HARDWARE_CONDITIONS)[number];
export const OFFER_HARDWARE_TEXT_MAX = 80;

/** Documentação de Recursos Numéricos (LACNIC/ANATEL). */
export const OFFER_NUMBERING_TEXT_MAX = 120;

/** Texto obrigatório só quando a oferta é da categoria informada. */
const requiredForCategory = (
  category: OfferCategory,
  {
    max,
    tooLong,
    required,
  }: { max: number; tooLong: string; required: string },
) =>
  yup
    .string()
    .trim()
    .max(max, tooLong)
    .default("")
    .test(
      `${category}-required`,
      required,
      (value, context) => context.parent.category !== category || !!value,
    );

const requiredForHardware = (required: string) =>
  requiredForCategory("hardware", {
    max: OFFER_HARDWARE_TEXT_MAX,
    tooLong: "SellerOfferCreate.errors.hardwareTooLong",
    required,
  });

const requiredForNumbering = (required: string) =>
  requiredForCategory("numberingResources", {
    max: OFFER_NUMBERING_TEXT_MAX,
    tooLong: "SellerOfferCreate.errors.numberingTooLong",
    required,
  });

/**
 * Tipo do produto na marketplace-api: Hardware / CPE é enviado (`physical`),
 * as demais categorias são serviços. Na edição vale o tipo salvo na oferta
 * (`productType` do formulário) — ele não muda depois de criada.
 */
export const OFFER_PRODUCT_TYPES = ["service", "physical"] as const;
export type OfferProductType = (typeof OFFER_PRODUCT_TYPES)[number];

export function offerProductType(values: {
  productType?: OfferProductType | "";
  category?: OfferCategory | "";
}): OfferProductType {
  if (values.productType) return values.productType;
  return values.category === "hardware" ? "physical" : "service";
}

/** Limites do pacote de envio (marketplace-api, physical_goods.py). */
export const OFFER_SHIPPING_MAX_WEIGHT_KG = 1000;
export const OFFER_SHIPPING_MAX_SIDE_CM = 400;

/** CEP com 8 dígitos ("01310-100"); "00000-000" não vale. */
export function postalCodeDigits(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  return /^\d{8}$/.test(digits) && digits !== "00000000" ? digits : null;
}

/** Medida do pacote: obrigatória em produto físico, maior que zero e até `max`. */
const shippingMeasure = (max: number, required: string, range: string) =>
  yup
    .string()
    .trim()
    .default("")
    .test(
      "shipping-required",
      required,
      (value, context) =>
        offerProductType(context.parent) !== "physical" || !!value,
    )
    .test("shipping-range", range, (value) => {
      if (!value) return true;
      const number = parseDecimal(value);
      return number !== null && number > 0 && number <= max;
    });

/**
 * Número positivo opcional digitado como texto ("500", "0,5"). Vazio passa —
 * a obrigatoriedade é tratada à parte.
 */
const positiveDecimal = (message: string) =>
  yup
    .string()
    .trim()
    .default("")
    .test("positive-decimal", message, (value) => {
      if (!value) return true;
      const number = parseDecimal(value);
      return number !== null && number > 0;
    });

/**
 * Etapa 3 — Especificações técnicas. Só a velocidade tem campo na
 * marketplace-api (`speed`, texto livre); latência, SLAs, prazo e os dados de
 * hardware ficam no assistente até a API ter onde guardá-los (o SLA da API é
 * por organização, `PATCH /slaConfig`, não por oferta).
 */
export const sellerOfferTechnicalSpecsSchema = yup.object({
  // Banda só faz sentido para conectividade — a API deixa `speed` vazio nas
  // demais categorias.
  speedValue: positiveDecimal("SellerOfferCreate.errors.speedInvalid").test(
    "speed-required",
    "SellerOfferCreate.errors.speedRequired",
    (value, context) =>
      context.parent.category !== "connectivity" || !!value?.trim(),
  ),
  speedUnit: yup
    .mixed<OfferSpeedUnit>()
    .oneOf([...OFFER_SPEED_UNITS])
    .default("Mbps"),
  maxLatency: positiveDecimal("SellerOfferCreate.errors.latencyInvalid"),
  acceptanceSla: yup
    .string()
    .trim()
    .required("SellerOfferCreate.errors.acceptanceSlaRequired")
    .test(
      "acceptance-sla-range",
      "SellerOfferCreate.errors.acceptanceSlaRange",
      (value) => {
        const hours = parseDecimal(value);
        return (
          hours !== null &&
          Number.isInteger(hours) &&
          hours >= OFFER_ACCEPTANCE_SLA_MIN &&
          hours <= OFFER_ACCEPTANCE_SLA_MAX
        );
      },
    )
    .default(OFFER_ACCEPTANCE_SLA_DEFAULT),
  technicalSla: yup
    .string()
    .trim()
    .required("SellerOfferCreate.errors.technicalSlaRequired")
    .test(
      "technical-sla-range",
      "SellerOfferCreate.errors.technicalSlaRange",
      (value) => {
        const percent = parseDecimal(value);
        return percent !== null && percent > 0 && percent <= 100;
      },
    )
    .default(""),
  deliveryTime: yup
    .string()
    .trim()
    .required("SellerOfferCreate.errors.deliveryTimeRequired")
    .max(
      OFFER_DELIVERY_TIME_MAX,
      "SellerOfferCreate.errors.deliveryTimeTooLong",
    )
    .default(""),

  // Hardware / CPE (Figma 2074-56987): fabricante, modelo e condição são
  // obrigatórios só nessa categoria.
  hardwareManufacturer: requiredForHardware(
    "SellerOfferCreate.errors.manufacturerRequired",
  ),
  hardwareModel: requiredForHardware("SellerOfferCreate.errors.modelRequired"),
  hardwareCondition: yup
    .mixed<HardwareCondition | "">()
    .oneOf(["", ...HARDWARE_CONDITIONS])
    .default("")
    .test(
      "condition-required",
      "SellerOfferCreate.errors.conditionRequired",
      (value, context) => context.parent.category !== "hardware" || !!value,
    ),
  hardwareWarranty: yup
    .string()
    .trim()
    .max(OFFER_HARDWARE_TEXT_MAX, "SellerOfferCreate.errors.hardwareTooLong")
    .default(""),
  hardwareSerialization: yup
    .string()
    .trim()
    .max(OFFER_HARDWARE_TEXT_MAX, "SellerOfferCreate.errors.hardwareTooLong")
    .default(""),

  // Recursos Numéricos (Figma 2074-59682): documentação obrigatória só nessa
  // categoria.
  numberingResourceType: requiredForNumbering(
    "SellerOfferCreate.errors.numberingTypeRequired",
  ),
  numberingBlock: requiredForNumbering(
    "SellerOfferCreate.errors.numberingBlockRequired",
  ),
  numberingHolder: requiredForNumbering(
    "SellerOfferCreate.errors.numberingHolderRequired",
  ),

  // Envio (produto físico — Hardware / CPE): uma unidade embalada. A cotação
  // do frete usa peso, medidas e o CEP de onde o seller despacha.
  productType: yup
    .mixed<OfferProductType | "">()
    .oneOf(["", ...OFFER_PRODUCT_TYPES])
    .default(""),
  shippingWeightKg: shippingMeasure(
    OFFER_SHIPPING_MAX_WEIGHT_KG,
    "SellerOfferCreate.errors.weightRequired",
    "SellerOfferCreate.errors.weightRange",
  ),
  shippingHeightCm: shippingMeasure(
    OFFER_SHIPPING_MAX_SIDE_CM,
    "SellerOfferCreate.errors.heightRequired",
    "SellerOfferCreate.errors.sideRange",
  ),
  shippingWidthCm: shippingMeasure(
    OFFER_SHIPPING_MAX_SIDE_CM,
    "SellerOfferCreate.errors.widthRequired",
    "SellerOfferCreate.errors.sideRange",
  ),
  shippingLengthCm: shippingMeasure(
    OFFER_SHIPPING_MAX_SIDE_CM,
    "SellerOfferCreate.errors.lengthRequired",
    "SellerOfferCreate.errors.sideRange",
  ),
  shippingOriginPostalCode: yup
    .string()
    .trim()
    .default("")
    .test(
      "postal-code-required",
      "SellerOfferCreate.errors.postalCodeRequired",
      (value, context) =>
        offerProductType(context.parent) !== "physical" || !!value,
    )
    .test(
      "postal-code-format",
      "SellerOfferCreate.errors.postalCodeInvalid",
      (value) => !value || postalCodeDigits(value) !== null,
    ),
  // Opcional: sem ele, o seguro usa o preço da oferta.
  shippingInsuranceValue: positiveDecimal(
    "SellerOfferCreate.errors.insuranceInvalid",
  ),
});

/** Modelos de preço (Figma 2073-50238). A API só guarda o preço mensal. */
export const OFFER_PRICING_MODELS = ["monthly", "annual", "oneTime"] as const;
export type OfferPricingModel = (typeof OFFER_PRICING_MODELS)[number];

/** Moedas aceitas. A API ainda não guarda moeda — tudo é BRL por enquanto. */
export const OFFER_CURRENCIES = ["BRL", "USD"] as const;
export type OfferCurrency = (typeof OFFER_CURRENCIES)[number];

export const OFFER_CANCELLATION_TERMS_MAX = 300;

/**
 * Valor em dinheiro com no máximo 2 casas ("1.890,00", "99.9"). As casas são
 * contadas no texto — multiplicar por 100 erra com ponto flutuante (0,29).
 */
function isMoney(value: string, { allowZero }: { allowZero: boolean }) {
  const amount = parseDecimal(value);
  if (amount === null) return false;
  if (allowZero ? amount < 0 : amount <= 0) return false;
  const text = value.trim();
  const separator = text.includes(",") ? "," : ".";
  const decimals = text.includes(separator)
    ? text.slice(text.lastIndexOf(separator) + 1)
    : "";
  return decimals.length <= 2;
}

/**
 * Etapa 4 — Preço e disponibilidade (Figma 2073-50238). Na marketplace-api
 * vão `monthlyPrice` (preço), `installationPrice` (setup) e a promoção
 * (`PUT /promotion`, depois de criada). Modelo de preço, moeda, estoque,
 * cancelamento e vigência ficam no assistente até a API ter os campos.
 */
export const sellerOfferPricingSchema = yup.object({
  pricingModel: yup
    .mixed<OfferPricingModel | "">()
    .oneOf(
      [...OFFER_PRICING_MODELS],
      "SellerOfferCreate.errors.pricingModelRequired",
    )
    .default(""),
  currency: yup
    .mixed<OfferCurrency>()
    .oneOf([...OFFER_CURRENCIES])
    .default("BRL"),
  price: yup
    .string()
    .trim()
    .required("SellerOfferCreate.errors.priceRequired")
    .test("price-valid", "SellerOfferCreate.errors.priceInvalid", (value) =>
      isMoney(value, { allowZero: false }),
    )
    .default(""),
  setupFee: yup
    .string()
    .trim()
    .default("")
    .test(
      "setup-valid",
      "SellerOfferCreate.errors.setupInvalid",
      (value) => !value || isMoney(value, { allowZero: true }),
    ),
  stock: yup
    .string()
    .trim()
    .default("")
    .test("stock-valid", "SellerOfferCreate.errors.stockInvalid", (value) => {
      if (!value) return true;
      return /^\d+$/.test(value);
    }),
  cancellationTerms: yup
    .string()
    .trim()
    .required("SellerOfferCreate.errors.cancellationRequired")
    .max(
      OFFER_CANCELLATION_TERMS_MAX,
      "SellerOfferCreate.errors.cancellationTooLong",
    )
    .default(""),
  validUntil: yup
    .string()
    .default("")
    .test(
      "valid-until-future",
      "SellerOfferCreate.errors.validUntilPast",
      (value) => !value || value >= todayIso(),
    ),
  sponsored: yup.boolean().default(false),
});

export const sellerOfferSchema = sellerOfferCoverageSchema
  .concat(sellerOfferBasicInfoSchema)
  .concat(sellerOfferTechnicalSpecsSchema)
  .concat(sellerOfferPricingSchema);

export type SellerOfferValues = yup.InferType<typeof sellerOfferSchema>;

/** Valores iniciais do assistente (oferta nova). */
export const SELLER_OFFER_DEFAULTS: SellerOfferValues = {
  category: "",
  locations: [EMPTY_OFFER_LOCATION],
  coverageRegion: "",
  name: "",
  shortDescription: "",
  description: "",
  speedValue: "",
  speedUnit: "Mbps",
  maxLatency: "",
  acceptanceSla: OFFER_ACCEPTANCE_SLA_DEFAULT,
  technicalSla: "",
  deliveryTime: "",
  hardwareManufacturer: "",
  hardwareModel: "",
  hardwareCondition: "",
  hardwareWarranty: "",
  hardwareSerialization: "",
  numberingResourceType: "",
  numberingBlock: "",
  numberingHolder: "",
  productType: "",
  shippingWeightKg: "",
  shippingHeightCm: "",
  shippingWidthCm: "",
  shippingLengthCm: "",
  shippingOriginPostalCode: "",
  shippingInsuranceValue: "",
  pricingModel: "",
  currency: "BRL",
  price: "",
  setupFee: "",
  stock: "",
  cancellationTerms: "",
  validUntil: "",
  sponsored: false,
};
