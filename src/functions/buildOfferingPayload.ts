import { parseDecimal } from "@/functions/parseDecimal";
import type { SellerOfferValues } from "@/schemas/sellerOffer";
import type {
  CreateOfferingInput,
  ProductOffering,
  UpdateOfferingInput,
} from "@/services/productCatalog.service";

/** Chaves do `metadata` preenchidas pelo assistente. */
export const OFFERING_METADATA_KEYS = [
  "shortDescription",
  "description",
  "technicalSlaPercent",
  "acceptanceSlaHours",
  "maxLatencyMs",
  "deliveryTime",
  "pricingModel",
  "currency",
  "stock",
  "cancellationTerms",
  "validUntil",
  "hardware",
  "numbering",
] as const;

/** "1.890,00" → "1890.00" (formato decimal que a marketplace-api espera). */
export function toApiDecimal(value: string): string {
  const amount = parseDecimal(value);
  return (amount ?? 0).toFixed(2);
}

/** Remove chaves vazias (undefined, null, "") de um objeto raso. */
function compact<T extends Record<string, unknown>>(
  object: T,
): Partial<T> | undefined {
  const entries = Object.entries(object).filter(
    ([, value]) => value !== undefined && value !== null && value !== "",
  );
  return entries.length
    ? (Object.fromEntries(entries) as Partial<T>)
    : undefined;
}

const numberOrUndefined = (value: string) => parseDecimal(value) ?? undefined;

/**
 * Corpo de `POST /productOffering` a partir do assistente.
 *
 * A oferta só tem campo para nome, preço, setup e velocidade. O resto vai no
 * `metadata` (texto livre, sem validação no backend). Ficam de fora a
 * categoria (representada pelo plano), a localidade A/Z, a região de
 * recursos numéricos e a imagem — aguardam campos próprios na API.
 */
export function buildOfferingPayload(
  values: SellerOfferValues,
  specificationId: string,
): CreateOfferingInput {
  const hasSpeed =
    values.category !== "numberingResources" && !!values.speedValue?.trim();

  const metadata = compact({
    shortDescription: values.shortDescription.trim(),
    description: values.description.trim(),
    technicalSlaPercent: numberOrUndefined(values.technicalSla),
    acceptanceSlaHours: numberOrUndefined(values.acceptanceSla),
    maxLatencyMs:
      values.category !== "numberingResources"
        ? numberOrUndefined(values.maxLatency)
        : undefined,
    deliveryTime: values.deliveryTime.trim(),
    pricingModel: values.pricingModel,
    currency: values.currency,
    // Vazio = sob consulta.
    stock: values.stock ? Number(values.stock) : undefined,
    cancellationTerms: values.cancellationTerms.trim(),
    validUntil: values.validUntil,
    hardware:
      values.category === "hardware"
        ? compact({
            manufacturer: values.hardwareManufacturer.trim(),
            model: values.hardwareModel.trim(),
            condition: values.hardwareCondition,
            warranty: values.hardwareWarranty.trim(),
            serialization: values.hardwareSerialization.trim(),
          })
        : undefined,
    numbering:
      values.category === "numberingResources"
        ? compact({
            resourceType: values.numberingResourceType.trim(),
            block: values.numberingBlock.trim(),
            holder: values.numberingHolder.trim(),
          })
        : undefined,
  });

  return {
    name: values.name.trim(),
    specificationId,
    monthlyPrice: toApiDecimal(values.price),
    installationPrice: values.setupFee ? toApiDecimal(values.setupFee) : "0.00",
    speed: hasSpeed ? `${values.speedValue.trim()} ${values.speedUnit}` : null,
    metadata: metadata ?? null,
  };
}

/**
 * Corpo de `PATCH /productOffering/{id}` na edição. As chaves do assistente
 * no `metadata` são reescritas (campo apagado some); as demais — de outras
 * telas ou integrações — ficam como estavam.
 */
export function buildOfferingUpdate(
  values: SellerOfferValues,
  specificationId: string,
  offering: ProductOffering,
): UpdateOfferingInput {
  const payload = buildOfferingPayload(values, specificationId);
  const managed = new Set<string>(OFFERING_METADATA_KEYS);
  const kept = Object.fromEntries(
    Object.entries(offering.metadata ?? {}).filter(
      ([key]) => !managed.has(key),
    ),
  );
  return { ...payload, metadata: { ...kept, ...payload.metadata } };
}
