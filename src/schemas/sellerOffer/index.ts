import * as yup from "yup";

import {
  OFFER_CATEGORIES,
  offerCategory,
  type OfferCategory,
} from "@/data/offerCategories";
import {
  ruleValuesErrors,
  templateFieldsErrors,
  type RuleFormValues,
  type RuleToggles,
  type TemplateFormValues,
} from "@/functions/templateFields";
import type {
  CategoryTemplateField,
  CategoryTemplateRule,
} from "@/services/productCatalog.service";
import {
  packagePreset,
  SHIPPING_PACKAGE_SIZES,
  type ShippingPackageSize,
} from "@/data/shippingPackagePresets";
import { parseDecimal } from "@/functions/parseDecimal";
import { exceedsMarketLimits } from "@/functions/shippingPackage";
import { todayIso } from "@/functions/todayIso";

/* ---------------------------------------------------------------------------
 * Criação de oferta do seller — assistente em 5 etapas (Figma 2664-55368),
 * mais a Logística no produto físico (Figma 2943-33503),
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
 * Recorte da cobertura ("Escolher cobertura"): toda a área do KMZ, as áreas
 * (placemarks) escolhidas do KMZ ou um polígono desenhado pelo seller (Figma
 * 2697-43374 / 2697-43449).
 */
export const COVERAGE_SCOPE_MODES = ["full", "areas", "custom"] as const;
export type CoverageScopeMode = (typeof COVERAGE_SCOPE_MODES)[number];

/**
 * Contexto da validação (resolver do `FormSellerOffer`): os campos genéricos
 * do template da categoria escolhida — os que não têm tela própria — e as
 * regras condicionais dela.
 */
export interface SellerOfferValidationContext {
  templateFields?: CategoryTemplateField[];
  rules?: CategoryTemplateRule[];
}

/** A localidade só existe nas categorias com cobertura (flag da API). */
function locationApplies(parent: { requiresCoverage?: boolean }): boolean {
  return !!parent.requiresCoverage;
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
function rootOf(context: yup.TestContext): { requiresCoverage?: boolean } {
  return context.from?.[context.from.length - 1]?.value ?? {};
}

/** Condição do equipamento (Hardware / CPE), opções do template. */
export const HARDWARE_CONDITIONS = ["new", "used", "refurbished"] as const;
export type HardwareCondition = (typeof HARDWARE_CONDITIONS)[number];
export const OFFER_HARDWARE_TEXT_MAX = 80;
/** Equipamento serializado (`serialized`, booleano no template). */
export const HARDWARE_SERIALIZATION = ["yes", "no"] as const;
export type HardwareSerialization = (typeof HARDWARE_SERIALIZATION)[number];

/** Documentação de Recursos Numéricos (LACNIC/ANATEL). */
export const OFFER_NUMBERING_TEXT_MAX = 120;
/** Tipo do recurso (`resourceType` do template). */
export const NUMBERING_RESOURCE_TYPES = [
  "ipv4",
  "ipv6",
  "asn",
  "e164",
] as const;
export type NumberingResourceType = (typeof NUMBERING_RESOURCE_TYPES)[number];
/** Região/registro (`registry` do template). */
export const NUMBERING_REGISTRIES = [
  "lacnic",
  "nic_br",
  "arin",
  "ripe",
  "apnic",
  "afrinic",
  "anatel",
] as const;
export type NumberingRegistry = (typeof NUMBERING_REGISTRIES)[number];

/** Infra física: unidade vendida (`soldUnit` do template). */
export const INFRA_SOLD_UNITS = [
  "port",
  "fiber",
  "rack_unit",
  "square_meter",
  "meter",
  "unit",
] as const;
export type InfraSoldUnit = (typeof INFRA_SOLD_UNITS)[number];
export const OFFER_INFRA_TEXT_MAX = 120;
export const OFFER_INFRA_DETAILS_MAX = 1000;

/** Uma localidade: endereço escolhido nas sugestões do Mapbox + raio. */
export const offerLocationSchema = yup.object({
  label: yup
    .string()
    .trim()
    .max(255, "SellerOfferCreate.errors.locationTooLong")
    .default("")
    // A primeira localidade é a "Localidade A" do template da categoria
    // (`locationA` em Conectividade, `location` em Infra física).
    .test(
      "location-required",
      "SellerOfferCreate.errors.locationRequired",
      (value, context) =>
        !locationApplies(rootOf(context)) ||
        !context.path.startsWith("locations[0]") ||
        !!value,
    )
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
  // Família da raiz (decide as telas próprias); a categoria de verdade,
  // raiz ou subcategoria, vai em `categoryId`.
  category: yup
    .mixed<OfferCategory | "">()
    .oneOf(
      [...OFFER_CATEGORIES.map((category) => category.key), "custom"],
      "SellerOfferCreate.errors.categoryRequired",
    )
    .required("SellerOfferCreate.errors.categoryRequired"),
  categoryId: yup
    .string()
    .default("")
    .test(
      "category-id-required",
      "SellerOfferCreate.errors.categoryRequired",
      (value, context) => !context.parent.category || !!value,
    ),
  /** Raiz › subcategoria, para a revisão e o aviso de publicação. */
  categoryLabel: yup.string().default(""),
  /** Flags da categoria escolhida na API (NEU-561). */
  requiresCoverage: yup.boolean().default(false),
  hasNumericStock: yup.boolean().default(false),
  // Localidades de atendimento (A/Z): uma ou mais, cada uma com endereço e
  // raio. Opcionais e só no fluxo com cobertura (Conectividade e Infra
  // Física) — nas demais categorias o campo some e não é validado.
  locations: yup
    .array()
    .of(offerLocationSchema)
    .max(OFFER_LOCATIONS_MAX, "SellerOfferCreate.errors.locationsMax")
    .default([]),
  // Abrangência sem KMZ: o registro dos recursos numéricos (`registry` do
  // template), obrigatório nessa categoria.
  coverageRegion: yup
    .mixed<NumberingRegistry | "">()
    .oneOf(
      ["", ...NUMBERING_REGISTRIES],
      "SellerOfferCreate.errors.regionRequired",
    )
    .default("")
    .test(
      "region-required",
      "SellerOfferCreate.errors.regionRequired",
      (value, context) =>
        !offerCategory(context.parent.category)?.asksRegion || !!value,
    ),
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

/** Opção de uma lista, obrigatória só na categoria informada. */
const choiceForCategory = <T extends string>(
  category: OfferCategory,
  options: readonly T[],
  required: string,
) =>
  yup
    .mixed<T | "">()
    .oneOf(["", ...options], required)
    .default("")
    .test(
      `${category}-choice-required`,
      required,
      (value, context) => context.parent.category !== category || !!value,
    );

/** Inteiro ≥ 0 (só dígitos), obrigatório só na categoria informada. */
const integerForCategory = (category: OfferCategory, required: string) =>
  yup
    .string()
    .trim()
    .default("")
    .test(
      "integer-valid",
      "SellerOfferCreate.errors.integerInvalid",
      (value) => (!value ? true : /^\d+$/.test(value)),
    )
    .test(
      `${category}-integer-required`,
      required,
      (value, context) => context.parent.category !== category || !!value,
    );

const requiredForInfra = (required: string, max = OFFER_INFRA_TEXT_MAX) =>
  requiredForCategory("physicalInfra", {
    max,
    tooLong: "SellerOfferCreate.errors.infraTooLong",
    required,
  });

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
 * as demais categorias são serviços. O tipo acompanha a categoria, também
 * na edição (trocar para Hardware torna a oferta física). O `productType` do
 * formulário guarda o tipo salvo: vale só quando a categoria não é
 * reconhecida, e mostra ao PATCH se o tipo mudou.
 */
export const OFFER_PRODUCT_TYPES = ["service", "physical"] as const;
export type OfferProductType = (typeof OFFER_PRODUCT_TYPES)[number];

export function offerProductType(values: {
  productType?: OfferProductType | "";
  category?: OfferCategory | "";
}): OfferProductType {
  if (values.category) {
    return values.category === "hardware" ? "physical" : "service";
  }
  return values.productType || "service";
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
 * Atributos livres da oferta (Figma 3009-74313 e 2879-92995), em todas as
 * categorias: nome, tipo de dado e valores separados por vírgula. Vão no
 * `metadata.additionalProps`.
 */
export const OFFER_ATTRIBUTE_TYPES = [
  "text",
  "number",
  "mbps",
  "gbps",
  "ms",
  "percent",
] as const;
export type OfferAttributeType = (typeof OFFER_ATTRIBUTE_TYPES)[number];

export const OFFER_ATTRIBUTES_MAX = 20;
export const OFFER_ATTRIBUTE_NAME_MAX = 60;
export const OFFER_ATTRIBUTE_VALUES_MAX = 500;

export interface OfferAttribute {
  name: string;
  type: OfferAttributeType | "";
  /** Valores separados por vírgula ("100 Mbps, 500 Mbps"). */
  values: string;
}

export const EMPTY_OFFER_ATTRIBUTE: OfferAttribute = {
  name: "",
  type: "",
  values: "",
};

/** Linha sem nada preenchido: ignorada (não valida nem vai no payload). */
export function isBlankOfferAttribute(
  attribute: Partial<OfferAttribute> | undefined,
): boolean {
  return (
    !attribute?.name?.trim() && !attribute?.type && !attribute?.values?.trim()
  );
}

/** "100 Mbps, 500 Mbps," → ["100 Mbps", "500 Mbps"] (sem repetidos). */
export function offerAttributeValues(text: string): string[] {
  const values = text
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return [...new Set(values)];
}

/** Obrigatório quando a linha tem algum campo preenchido. */
const requiredInFilledAttribute = (
  value: string | undefined,
  context: yup.TestContext,
) => !!value?.trim() || isBlankOfferAttribute(context.parent);

const offerAttributeSchema = yup.object({
  name: yup
    .string()
    .trim()
    .max(
      OFFER_ATTRIBUTE_NAME_MAX,
      "SellerOfferCreate.errors.attributeNameTooLong",
    )
    .default("")
    .test(
      "attribute-name-required",
      "SellerOfferCreate.errors.attributeNameRequired",
      requiredInFilledAttribute,
    ),
  type: yup
    .mixed<OfferAttributeType | "">()
    .oneOf(["", ...OFFER_ATTRIBUTE_TYPES])
    .default("")
    .test(
      "attribute-type-required",
      "SellerOfferCreate.errors.attributeTypeRequired",
      requiredInFilledAttribute,
    ),
  values: yup
    .string()
    .trim()
    .max(
      OFFER_ATTRIBUTE_VALUES_MAX,
      "SellerOfferCreate.errors.attributeValuesTooLong",
    )
    .default("")
    .test(
      "attribute-values-required",
      "SellerOfferCreate.errors.attributeValuesRequired",
      requiredInFilledAttribute,
    ),
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
  // Garantia em meses e serialização: obrigatórias no template da categoria.
  hardwareWarranty: integerForCategory(
    "hardware",
    "SellerOfferCreate.errors.warrantyRequired",
  ),
  hardwareSerialization: choiceForCategory(
    "hardware",
    HARDWARE_SERIALIZATION,
    "SellerOfferCreate.errors.serializationRequired",
  ),

  // Conectividade: IPs inclusos no plano (obrigatório no template).
  includedIps: integerForCategory(
    "connectivity",
    "SellerOfferCreate.errors.includedIpsRequired",
  ),

  // Infra física: capacidade, unidade vendida e energia/espaço/porta
  // (obrigatórios no template).
  infraCapacity: requiredForInfra("SellerOfferCreate.errors.capacityRequired"),
  infraSoldUnit: choiceForCategory(
    "physicalInfra",
    INFRA_SOLD_UNITS,
    "SellerOfferCreate.errors.soldUnitRequired",
  ),
  infraPowerSpacePort: requiredForInfra(
    "SellerOfferCreate.errors.powerSpacePortRequired",
    OFFER_INFRA_DETAILS_MAX,
  ),

  // Recursos Numéricos (Figma 2074-59682): documentação obrigatória só nessa
  // categoria. O tipo segue as opções do template.
  numberingResourceType: choiceForCategory(
    "numberingResources",
    NUMBERING_RESOURCE_TYPES,
    "SellerOfferCreate.errors.numberingTypeRequired",
  ),
  numberingBlock: requiredForNumbering(
    "SellerOfferCreate.errors.numberingBlockRequired",
  ),
  numberingHolder: requiredForNumbering(
    "SellerOfferCreate.errors.numberingHolderRequired",
  ),

  attributes: yup
    .array()
    .of(offerAttributeSchema)
    .max(OFFER_ATTRIBUTES_MAX, "SellerOfferCreate.errors.attributesMax")
    .default([]),

  // Campos do template sem tela própria (subcategoria, categoria nova ou
  // campos opcionais da família), por chave do template. Os campos e as
  // regras de cada um chegam pelo contexto da validação.
  templateValues: yup
    .mixed<TemplateFormValues>()
    .default(() => ({}))
    .test("template-values", function (value) {
      const { templateFields = [] } = (this.options.context ??
        {}) as SellerOfferValidationContext;
      const errors = Object.entries(
        templateFieldsErrors(templateFields, value),
      ).map(([key, message]) =>
        this.createError({ path: `templateValues.${key}`, message }),
      );
      return errors.length ? new yup.ValidationError(errors) : true;
    }),

  // Regras condicionais do template (NEU-627): as opcionais que o Seller
  // ligou e, por regra, os campos de valor. Regra ligada pede todos.
  rulesEnabled: yup.mixed<RuleToggles>().default(() => ({})),
  ruleValues: yup
    .mixed<RuleFormValues>()
    .default(() => ({}))
    .test("rule-values", function (value) {
      const { rules = [] } = (this.options.context ??
        {}) as SellerOfferValidationContext;
      const errors = Object.entries(
        ruleValuesErrors(rules, this.parent.rulesEnabled, value),
      ).map(([path, message]) =>
        this.createError({ path: `ruleValues.${path}`, message }),
      );
      return errors.length ? new yup.ValidationError(errors) : true;
    }),

  // Hardware / CPE é produto físico (`physical`): ganha a etapa Logística.
  productType: yup
    .mixed<OfferProductType | "">()
    .oneOf(["", ...OFFER_PRODUCT_TYPES])
    .default(""),
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
 * Tempo para postagem (`shipping.postingDays`, RN-LOG-01): em quantos dias
 * úteis, depois da venda, o seller entrega o pacote à transportadora.
 * 0 = no mesmo dia; 1 a 3 = dias úteis; sob encomenda = 4 a 30 (o seller
 * informa). Padrão: 1 dia útil.
 */
export const OFFER_SHIPPING_DISPATCH_TIMES = [
  "sameDay",
  "oneDay",
  "twoDays",
  "threeDays",
  "onDemand",
] as const;
export type OfferShippingDispatchTime =
  (typeof OFFER_SHIPPING_DISPATCH_TIMES)[number];

/** Dias úteis de cada opção fixa do tempo para postagem. */
export const OFFER_POSTING_DAYS: Record<
  Exclude<OfferShippingDispatchTime, "onDemand">,
  number
> = { sameDay: 0, oneDay: 1, twoDays: 2, threeDays: 3 };
export const OFFER_ON_DEMAND_MIN_DAYS = 4;
export const OFFER_ON_DEMAND_MAX_DAYS = 30;

/** `postingDays` da API a partir da opção (e dos dias, sob encomenda). */
export function postingDaysOf(
  dispatch: OfferShippingDispatchTime,
  onDemandDays: string,
): number {
  if (dispatch !== "onDemand") return OFFER_POSTING_DAYS[dispatch];
  return Number(onDemandDays);
}

/**
 * Modalidade de frete (`metadata.shippingPolicy.mode`). Dentro do limite de
 * mercado: integração (padrão), frete grátis ou retirada. Acima dele: frete
 * de carga ou frete a combinar (RFQ).
 */
export const OFFER_SHIPPING_STANDARD_MODES = [
  "integration",
  "freeShipping",
  "pickup",
] as const;
export const OFFER_SHIPPING_OUT_OF_LIMIT_MODES = [
  "cargo",
  "toBeAgreed",
] as const;
export const OFFER_SHIPPING_MODES = [
  ...OFFER_SHIPPING_STANDARD_MODES,
  ...OFFER_SHIPPING_OUT_OF_LIMIT_MODES,
] as const;
export type OfferShippingMode = (typeof OFFER_SHIPPING_MODES)[number];

/** Modalidades permitidas para o pacote (fora do limite: carga/combinar). */
export function shippingModesFor(
  exceedsLimits: boolean | null,
): readonly OfferShippingMode[] {
  return exceedsLimits
    ? OFFER_SHIPPING_OUT_OF_LIMIT_MODES
    : OFFER_SHIPPING_STANDARD_MODES;
}

export const OFFER_CARGO_MAX_DELIVERY_DAYS = 90;
export const OFFER_PICKUP_TEXT_MAX = 1000;

/** Pacote do formulário (`context.parent`) para as regras de limite. */
const packageOf = (parent: Record<string, string>) =>
  exceedsMarketLimits({
    weightKg: parent.shippingWeightKg,
    heightCm: parent.shippingHeightCm,
    widthCm: parent.shippingWidthCm,
    lengthCm: parent.shippingLengthCm,
  });

const isPhysical = (context: yup.TestContext) =>
  offerProductType(context.parent) === "physical";

/** Inteiro digitado ("12") dentro de [min, max]. */
const integerIn = (value: string, min: number, max: number) =>
  /^\d+$/.test(value) && Number(value) >= min && Number(value) <= max;

/**
 * Etapa Logística — só em produto físico (Hardware / CPE), Figma 2943-33503
 * e RN-LOG-01. Origem, prazo, tamanho, peso e medidas vão em `shipping`;
 * modalidade, acréscimo, rastreio, retirada e frete de carga, em
 * `metadata.shippingPolicy` (ver `buildOfferingPayload`).
 */
export const sellerOfferLogisticsSchema = yup.object({
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
  // Só o CEP: ainda não há cadastro de endereços do seller para escolher.
  shippingOriginPostalCode: yup
    .string()
    .trim()
    .default("")
    .test(
      "postal-code-required",
      "SellerOfferCreate.errors.postalCodeRequired",
      (value, context) => !isPhysical(context) || !!value,
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
  shippingDispatch: yup
    .mixed<OfferShippingDispatchTime>()
    .oneOf([...OFFER_SHIPPING_DISPATCH_TIMES])
    .default("oneDay"),
  // Dias úteis da opção "Sob encomenda" (4 a 30).
  shippingOnDemandDays: yup
    .string()
    .trim()
    .default("")
    .test(
      "on-demand-days",
      "SellerOfferCreate.errors.onDemandDaysRange",
      (value, context) =>
        !isPhysical(context) ||
        context.parent.shippingDispatch !== "onDemand" ||
        integerIn(value, OFFER_ON_DEMAND_MIN_DAYS, OFFER_ON_DEMAND_MAX_DAYS),
    ),
  // Pequeno, Médio e Grande têm peso máximo e cabem no limite de mercado;
  // Carga é só acima dele.
  shippingPackageSize: yup
    .mixed<ShippingPackageSize>()
    .oneOf([...SHIPPING_PACKAGE_SIZES])
    .default("custom")
    .test(
      "package-size-fits",
      "SellerOfferCreate.errors.packageSizeMismatch",
      (value, context) => {
        const preset = packagePreset(value);
        if (!isPhysical(context) || !preset) return true;
        const weight = parseDecimal(context.parent.shippingWeightKg);
        const exceeds = packageOf(context.parent);
        if (weight === null || exceeds === null) return true;
        return !exceeds && weight <= preset.maxWeightKg;
      },
    )
    .test(
      "cargo-above-limit",
      "SellerOfferCreate.errors.cargoWithinLimit",
      (value, context) =>
        !isPhysical(context) ||
        value !== "cargo" ||
        packageOf(context.parent) !== false,
    ),
  shippingMode: yup
    .mixed<OfferShippingMode>()
    .oneOf([...OFFER_SHIPPING_MODES])
    .default("integration")
    .test(
      "mode-fits-package",
      "SellerOfferCreate.errors.shippingModeInvalid",
      (value, context) => {
        if (!isPhysical(context) || !value) return true;
        const exceeds = packageOf(context.parent);
        return exceeds === null || shippingModesFor(exceeds).includes(value);
      },
    ),
  // Acréscimo opcional somado ao frete da transportadora.
  shippingExtraFee: yup
    .string()
    .trim()
    .default("")
    .test(
      "extra-fee-valid",
      "SellerOfferCreate.errors.extraFeeInvalid",
      (value) => !value || isMoney(value, { allowZero: true }),
    ),
  shippingAutoTracking: yup.boolean().default(true),
  // Sem campo na tela: preserva o valor salvo na oferta.
  shippingAutoAccept: yup.boolean().default(false),
  // Retirada no local: endereço e horário, opcionais.
  shippingPickupAddress: yup
    .string()
    .trim()
    .max(OFFER_PICKUP_TEXT_MAX, "SellerOfferCreate.errors.pickupTooLong")
    .default(""),
  shippingPickupHours: yup
    .string()
    .trim()
    .max(OFFER_PICKUP_TEXT_MAX, "SellerOfferCreate.errors.pickupTooLong")
    .default(""),
  // Frete de carga: valor e prazo do seller, usados quando a integração não
  // cota o pacote. Opcionais, mas vão juntos.
  shippingCargoPrice: yup
    .string()
    .trim()
    .default("")
    .test(
      "cargo-price-valid",
      "SellerOfferCreate.errors.cargoPriceInvalid",
      (value) => !value || isMoney(value, { allowZero: false }),
    )
    .test(
      "cargo-together",
      "SellerOfferCreate.errors.cargoPriceRequired",
      (value, context) =>
        context.parent.shippingMode !== "cargo" ||
        !!value ||
        !context.parent.shippingCargoDays?.trim(),
    ),
  shippingCargoDays: yup
    .string()
    .trim()
    .default("")
    .test(
      "cargo-days-range",
      "SellerOfferCreate.errors.cargoDaysRange",
      (value) => !value || integerIn(value, 1, OFFER_CARGO_MAX_DELIVERY_DAYS),
    )
    .test(
      "cargo-together",
      "SellerOfferCreate.errors.cargoDaysRequired",
      (value, context) =>
        context.parent.shippingMode !== "cargo" ||
        !!value ||
        !context.parent.shippingCargoPrice?.trim(),
    ),
});

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
    })
    // Hardware e Recursos Numéricos só publicam com `stockQuantity`.
    .test(
      "stock-required",
      "SellerOfferCreate.errors.stockRequired",
      (value, context) =>
        !context.parent.hasNumericStock || !!value,
    ),
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
  .concat(sellerOfferLogisticsSchema)
  .concat(sellerOfferPricingSchema);

export type SellerOfferValues = yup.InferType<typeof sellerOfferSchema>;

/** Valores iniciais do assistente (oferta nova). */
export const SELLER_OFFER_DEFAULTS: SellerOfferValues = {
  category: "",
  categoryId: "",
  categoryLabel: "",
  requiresCoverage: false,
  hasNumericStock: false,
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
  includedIps: "",
  infraCapacity: "",
  infraSoldUnit: "",
  infraPowerSpacePort: "",
  numberingResourceType: "",
  numberingBlock: "",
  numberingHolder: "",
  attributes: [EMPTY_OFFER_ATTRIBUTE],
  templateValues: {},
  rulesEnabled: {},
  ruleValues: {},
  productType: "",
  shippingWeightKg: "",
  shippingHeightCm: "",
  shippingWidthCm: "",
  shippingLengthCm: "",
  shippingOriginPostalCode: "",
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
  pricingModel: "",
  currency: "BRL",
  price: "",
  setupFee: "",
  stock: "",
  cancellationTerms: "",
  validUntil: "",
  sponsored: false,
};
