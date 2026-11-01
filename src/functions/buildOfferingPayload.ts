import { parseDecimal } from "@/functions/parseDecimal";
import {
  isBlankOfferAttribute,
  offerAttributeValues,
  offerProductType,
  postalCodeDigits,
  postingDaysOf,
  type OfferShippingMode,
  type SellerOfferValues,
} from "@/schemas/sellerOffer";
import type {
  CreateOfferingInput,
  OfferingShippingInput,
  OfferingShippingMode,
  OfferingShippingPolicy,
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
  "additionalProps",
  "shippingPolicy",
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

/** "1,2345" → 1.235: número com as casas que a API aceita. */
const roundTo = (value: string, digits: number) =>
  Number((parseDecimal(value) ?? 0).toFixed(digits));

/**
 * Pacote de envio do produto físico (Hardware / CPE): uma unidade embalada.
 * Peso com 3 casas, medidas e seguro com 2; CEP só com os dígitos. Vai também
 * o tempo para postagem e o tamanho da embalagem (RN-LOG-01).
 */
export function buildOfferingShipping(
  values: SellerOfferValues,
): OfferingShippingInput {
  return {
    weightKg: roundTo(values.shippingWeightKg, 3),
    heightCm: roundTo(values.shippingHeightCm, 2),
    widthCm: roundTo(values.shippingWidthCm, 2),
    lengthCm: roundTo(values.shippingLengthCm, 2),
    originPostalCode: postalCodeDigits(values.shippingOriginPostalCode) ?? "",
    postingDays: postingDaysOf(
      values.shippingDispatch,
      values.shippingOnDemandDays,
    ),
    packageSize: values.shippingPackageSize,
    ...(values.shippingInsuranceValue.trim()
      ? { insuranceValue: roundTo(values.shippingInsuranceValue, 2) }
      : {}),
  };
}

/** Modalidade do formulário → da API. */
export const SHIPPING_MODE_TO_API: Record<
  OfferShippingMode,
  OfferingShippingMode
> = {
  integration: "integration",
  freeShipping: "free_shipping",
  pickup: "pickup",
  cargo: "cargo",
  toBeAgreed: "to_be_agreed",
};

/**
 * Política de frete (`metadata.shippingPolicy`). As flags acompanham a
 * modalidade; o acréscimo só vale onde há cotação da transportadora
 * (integração e carga); retirada e frete de carga só levam os próprios
 * campos — a API recusa os de outra modalidade.
 */
export function buildShippingPolicy(
  values: SellerOfferValues,
): OfferingShippingPolicy {
  const mode = values.shippingMode;
  const isCargo = mode === "cargo";
  const isPickup = mode === "pickup";
  const hasCargoQuote =
    isCargo && !!values.shippingCargoPrice && !!values.shippingCargoDays;
  const pickupText = (value: string) =>
    isPickup && value.trim() ? value.trim() : null;
  return {
    mode: SHIPPING_MODE_TO_API[mode],
    sellerMarkup:
      mode === "integration" || isCargo
        ? toApiDecimal(values.shippingExtraFee)
        : "0.00",
    freeShipping: mode === "freeShipping",
    pickup: isPickup,
    pickupAddress: pickupText(values.shippingPickupAddress),
    pickupHours: pickupText(values.shippingPickupHours),
    automaticTracking: values.shippingAutoTracking,
    autoAccept: values.shippingAutoAccept,
    cargoPrice: hasCargoQuote ? toApiDecimal(values.shippingCargoPrice) : null,
    cargoDeliveryDays: hasCargoQuote ? Number(values.shippingCargoDays) : null,
  };
}

/**
 * Atributos da oferta (`metadata.additionalProps`): linhas vazias ficam de
 * fora; os valores viram lista. Sem atributos, a chave não vai.
 */
function buildAdditionalProps(values: SellerOfferValues) {
  const attributes = values.attributes
    .filter((attribute) => !isBlankOfferAttribute(attribute))
    .map((attribute) => ({
      name: attribute.name.trim(),
      type: attribute.type,
      values: offerAttributeValues(attribute.values),
    }));
  return attributes.length ? attributes : undefined;
}

/**
 * Campos comuns ao POST e ao PATCH.
 *
 * A oferta só tem campo para nome, preço, setup, velocidade e, no produto
 * físico, o pacote de envio. O resto vai no `metadata` (texto livre, sem
 * validação no backend). Ficam de fora a categoria (representada pelo plano),
 * a localidade A/Z, a região de recursos numéricos — aguardam campos próprios
 * na API. Fotos têm rotas próprias, depois da oferta criada
 * (`syncOfferingImages`).
 */
function offeringFields(
  values: SellerOfferValues,
  specificationId: string,
): Omit<CreateOfferingInput, "productType"> {
  const hasSpeed =
    values.category !== "numberingResources" && !!values.speedValue?.trim();
  const isPhysical = offerProductType(values) === "physical";

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
    additionalProps: buildAdditionalProps(values),
    shippingPolicy: isPhysical ? buildShippingPolicy(values) : undefined,
  });

  return {
    name: values.name.trim(),
    specificationId,
    monthlyPrice: toApiDecimal(values.price),
    installationPrice: values.setupFee ? toApiDecimal(values.setupFee) : "0.00",
    speed: hasSpeed ? `${values.speedValue.trim()} ${values.speedUnit}` : null,
    metadata: metadata ?? null,
    // Serviço com `shipping` volta 422: só o produto físico manda o pacote.
    ...(isPhysical ? { shipping: buildOfferingShipping(values) } : {}),
  };
}

/**
 * Corpo de `POST /productOffering` a partir do assistente. Hardware / CPE
 * nasce `physical` (publicar exige o pacote de envio, não cobertura); as
 * demais categorias, `service`.
 */
export function buildOfferingPayload(
  values: SellerOfferValues,
  specificationId: string,
): CreateOfferingInput {
  return {
    ...offeringFields(values, specificationId),
    productType: offerProductType(values),
  };
}

/**
 * Corpo de `PATCH /productOffering/{id}` na edição. As chaves do assistente
 * no `metadata` são reescritas (campo apagado some); as demais — de outras
 * telas ou integrações — ficam como estavam. O produto físico reenvia o
 * pacote de envio inteiro. `productType` só vai quando a categoria troca o
 * tipo (ex.: Software → Hardware / CPE vira `physical`, com o pacote).
 */
export function buildOfferingUpdate(
  values: SellerOfferValues,
  specificationId: string,
  offering: ProductOffering,
): UpdateOfferingInput {
  const payload = offeringFields(values, specificationId);
  const managed = new Set<string>(OFFERING_METADATA_KEYS);
  const kept = Object.fromEntries(
    Object.entries(offering.metadata ?? {}).filter(
      ([key]) => !managed.has(key),
    ),
  );
  const productType = offerProductType(values);
  return {
    ...payload,
    ...(productType !== (offering.productType ?? "service")
      ? { productType }
      : {}),
    metadata: { ...kept, ...payload.metadata },
  };
}
