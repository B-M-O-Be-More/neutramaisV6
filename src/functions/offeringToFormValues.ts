import { OFFER_CATEGORIES } from "@/data/offerCategories";
import {
  HARDWARE_CONDITIONS,
  OFFER_CURRENCIES,
  OFFER_PRICING_MODELS,
  OFFER_SPEED_UNITS,
  SELLER_OFFER_DEFAULTS,
  type SellerOfferValues,
} from "@/schemas/sellerOffer";
import type { ProductOffering } from "@/services/productCatalog.service";

type Metadata = Record<string, unknown>;

const text = (value: unknown) => (typeof value === "string" ? value : "");

const record = (value: unknown): Metadata =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Metadata)
    : {};

/** Um dos valores aceitos, ou o padrão. */
function oneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

/** Número para o texto dos campos com máscara ("99.5" → "99,5"). */
function decimalText(value: unknown, fractionDigits?: number): string {
  const number = typeof value === "number" ? value : Number(value);
  if (value === null || value === undefined || value === "") return "";
  if (!Number.isFinite(number)) return "";
  return new Intl.NumberFormat("pt-BR", {
    useGrouping: fractionDigits !== undefined,
    minimumFractionDigits: fractionDigits ?? 0,
    maximumFractionDigits: fractionDigits ?? 2,
  }).format(number);
}

/** Medida do pacote sem separador de milhar, até `digits` casas ("1,25"). */
function measureText(value: unknown, digits: number): string {
  const number = typeof value === "number" ? value : Number(value);
  if (value === null || value === undefined || value === "") return "";
  if (!Number.isFinite(number)) return "";
  return new Intl.NumberFormat("pt-BR", {
    useGrouping: false,
    maximumFractionDigits: digits,
  }).format(number);
}

/** "01310100" → "01310-100" (máscara do campo). */
const postalCodeText = (value: string | null | undefined) =>
  value && /^\d{8}$/.test(value)
    ? `${value.slice(0, 5)}-${value.slice(5)}`
    : (value ?? "");

/** "500 Mbps" → ["500", "Mbps"]. */
function splitSpeed(speed: string | null) {
  const match = speed?.trim().match(/^([\d.,]+)\s*(\w+)?$/);
  if (!match)
    return { speedValue: "", speedUnit: SELLER_OFFER_DEFAULTS.speedUnit };
  return {
    speedValue: match[1],
    speedUnit: oneOf(match[2], OFFER_SPEED_UNITS, "Mbps"),
  };
}

/**
 * Valores do assistente a partir de uma oferta salva (edição). A categoria
 * vem do nome do plano; o resto, das colunas da oferta e do `metadata` que o
 * assistente gravou (ver `buildOfferingPayload`). O que a API não guarda
 * (localidades, região) volta vazio. Fotos e cobertura ficam fora do
 * formulário (áreas com botão próprio).
 */
export function offeringToFormValues(
  offering: ProductOffering,
  specificationName: string | undefined,
): SellerOfferValues {
  const metadata = record(offering.metadata);
  const hardware = record(metadata.hardware);
  const numbering = record(metadata.numbering);
  const category =
    OFFER_CATEGORIES.find(
      (item) =>
        specificationName !== undefined &&
        item.specificationName.toLocaleLowerCase("pt-BR") ===
          specificationName.trim().toLocaleLowerCase("pt-BR"),
    )?.key ?? "";
  const installation = Number(offering.installationPrice);
  const shipping = offering.shipping;

  return {
    ...SELLER_OFFER_DEFAULTS,
    category,
    name: offering.name,
    shortDescription: text(metadata.shortDescription),
    description: text(metadata.description),
    ...splitSpeed(offering.speed),
    maxLatency: decimalText(metadata.maxLatencyMs),
    acceptanceSla:
      decimalText(metadata.acceptanceSlaHours) ||
      SELLER_OFFER_DEFAULTS.acceptanceSla,
    technicalSla: decimalText(metadata.technicalSlaPercent),
    deliveryTime: text(metadata.deliveryTime),
    hardwareManufacturer: text(hardware.manufacturer),
    hardwareModel: text(hardware.model),
    hardwareCondition: oneOf(
      hardware.condition,
      ["", ...HARDWARE_CONDITIONS],
      "",
    ),
    hardwareWarranty: text(hardware.warranty),
    hardwareSerialization: text(hardware.serialization),
    numberingResourceType: text(numbering.resourceType),
    numberingBlock: text(numbering.block),
    numberingHolder: text(numbering.holder),
    // O tipo é fixo: oferta antiga sem o campo é serviço.
    productType: offering.productType ?? "service",
    shippingWeightKg: measureText(shipping?.weightKg, 3),
    shippingHeightCm: measureText(shipping?.heightCm, 2),
    shippingWidthCm: measureText(shipping?.widthCm, 2),
    shippingLengthCm: measureText(shipping?.lengthCm, 2),
    shippingOriginPostalCode: postalCodeText(shipping?.originPostalCode),
    shippingInsuranceValue: decimalText(shipping?.insuranceValue, 2),
    pricingModel: oneOf(
      metadata.pricingModel,
      ["", ...OFFER_PRICING_MODELS],
      "",
    ),
    currency: oneOf(metadata.currency, OFFER_CURRENCIES, "BRL"),
    price: decimalText(offering.monthlyPrice, 2),
    setupFee: installation > 0 ? decimalText(installation, 2) : "",
    stock: typeof metadata.stock === "number" ? String(metadata.stock) : "",
    cancellationTerms: text(metadata.cancellationTerms),
    validUntil: text(metadata.validUntil),
    sponsored: !!offering.isPromoted,
  };
}
