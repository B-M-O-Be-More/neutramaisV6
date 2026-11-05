import { offerCategory } from "@/data/offerCategories";
import { parseDecimal } from "@/functions/parseDecimal";
import { templateCharacteristics } from "@/functions/templateFields";
import type { SellerOfferValues } from "@/schemas/sellerOffer";
import type {
  CategoryTemplateField,
  CreateSpecificationInput,
  SpecificationCharacteristics,
} from "@/services/productCatalog.service";

const integerOrUndefined = (value: string) =>
  /^\d+$/.test(value.trim()) ? Number(value.trim()) : undefined;

const numberOrUndefined = (value: string) => parseDecimal(value) ?? undefined;

/** Banda do formulário em Mbps (`bandwidthMbps`): "1 Gbps" → 1000. */
function bandwidthMbps(values: SellerOfferValues): number | undefined {
  const speed = parseDecimal(values.speedValue);
  if (speed === null) return undefined;
  return values.speedUnit === "Gbps" ? speed * 1000 : speed;
}

/** Endereço da localidade `index` (A = 0, Z = 1), quando informada. */
const locationLabel = (values: SellerOfferValues, index: number) =>
  values.locations[index]?.label.trim() || undefined;

/**
 * Valores do template da categoria (`characteristics` da especificação) a
 * partir do assistente. Cada categoria tem os seus campos — os obrigatórios
 * vêm validados do formulário. Chaves vazias ficam de fora (a API as trata
 * como ausentes).
 */
export function specificationCharacteristics(
  values: SellerOfferValues,
): SpecificationCharacteristics {
  const characteristics: Record<string, string | number | boolean | undefined> =
    (() => {
      switch (values.category) {
        case "connectivity":
          return {
            bandwidthMbps: bandwidthMbps(values),
            technicalSlaPercent: numberOrUndefined(values.technicalSla),
            locationA: locationLabel(values, 0),
            locationZ: locationLabel(values, 1),
            includedIps: integerOrUndefined(values.includedIps),
          };
        case "physicalInfra":
          return {
            location: locationLabel(values, 0),
            capacity: values.infraCapacity.trim(),
            soldUnit: values.infraSoldUnit,
            powerSpacePort: values.infraPowerSpacePort.trim(),
          };
        case "hardware":
          return {
            manufacturer: values.hardwareManufacturer.trim(),
            model: values.hardwareModel.trim(),
            condition: values.hardwareCondition,
            warrantyMonths: integerOrUndefined(values.hardwareWarranty),
            serialized: values.hardwareSerialization
              ? values.hardwareSerialization === "yes"
              : undefined,
          };
        case "numberingResources":
          return {
            resourceType: values.numberingResourceType,
            block: values.numberingBlock.trim(),
            allowedUse: values.numberingHolder.trim(),
            registry: values.coverageRegion,
          };
        default:
          return {};
      }
    })();
  return Object.fromEntries(
    Object.entries(characteristics).filter(
      ([, value]) => value !== undefined && value !== "",
    ),
  ) as SpecificationCharacteristics;
}

/**
 * Nome da especificação: o da família na raiz conhecida (é por ele que telas
 * antigas reconhecem a categoria); numa subcategoria ou categoria nova, o
 * nome dela na API (último trecho do caminho).
 */
function specificationNameOf(values: SellerOfferValues): string {
  const family = offerCategory(values.category)!;
  const isFamilyRoot =
    !values.categoryId || values.categoryId === family.categoryId;
  if (isFamilyRoot && family.specificationName) {
    return family.specificationName;
  }
  const path = values.categoryLabel.split(" › ");
  return path[path.length - 1].trim() || family.specificationName;
}

/**
 * Corpo de `POST /productSpecification`: a especificação é o SKU técnico da
 * oferta — uma por oferta, na categoria escolhida (raiz ou subcategoria),
 * com os valores do template: os das telas próprias da família mais os
 * campos genéricos (`templateFields`, os que não têm tela própria).
 */
export function buildSpecificationPayload(
  values: SellerOfferValues,
  templateFields: CategoryTemplateField[] = [],
): CreateSpecificationInput {
  const family = offerCategory(values.category)!;
  return {
    name: specificationNameOf(values),
    categoryId: values.categoryId || family.categoryId,
    characteristics: {
      ...specificationCharacteristics(values),
      ...templateCharacteristics(templateFields, values.templateValues),
    },
  };
}
