import type { OfferCategory } from "@/data/offerCategories";
import { parseDecimal } from "@/functions/parseDecimal";
import type {
  CategoryTemplateField,
  CategoryTemplateRule,
  OfferingRuleValues,
  SpecificationCharacteristics,
} from "@/services/productCatalog.service";

/**
 * Chaves do template que o assistente já preenche com tela própria
 * (`specificationCharacteristics`). As demais chaves do template da
 * categoria escolhida aparecem nos campos genéricos.
 */
export const FAMILY_TEMPLATE_KEYS: Record<OfferCategory, readonly string[]> = {
  connectivity: [
    "bandwidthMbps",
    "technicalSlaPercent",
    "locationA",
    "locationZ",
    "includedIps",
  ],
  physicalInfra: ["location", "capacity", "soldUnit", "powerSpacePort"],
  hardware: ["manufacturer", "model", "condition", "warrantyMonths", "serialized"],
  numberingResources: ["resourceType", "block", "allowedUse", "registry"],
  software: [],
  protocols: [],
  custom: [],
};

/** Valor de um campo genérico no formulário: texto, ou lista na múltipla escolha. */
export type TemplateFormValue = string | string[];
export type TemplateFormValues = Record<string, TemplateFormValue>;

/** Valor aceito pela API num campo de template ou de regra. */
export type TemplateApiValue = string | number | boolean | string[];

/** Limite de caracteres de cada tipo de texto na API. */
const TEXT_LIMITS: Partial<Record<CategoryTemplateField["type"], number>> = {
  short_text: 255,
  long_text: 5000,
  attachment: 2048,
  link: 2048,
};

/** Campos genéricos: o template da categoria sem as chaves com tela própria. */
export function formTemplateFields(
  template: CategoryTemplateField[] | null | undefined,
  family: OfferCategory | "" | null | undefined,
): CategoryTemplateField[] {
  if (!template?.length) return [];
  const managed = new Set(family ? FAMILY_TEMPLATE_KEYS[family] : []);
  return template.filter((field) => !managed.has(field.key));
}

/**
 * Texto legível de um valor técnico sem tradução ("mobile_4g" → "Mobile 4g"):
 * opção ou unidade criada pelo Admin depois das traduções do front.
 */
export function humanizeTemplateValue(value: string): string {
  const text = value.replace(/[_-]+/g, " ").trim();
  return text ? text[0].toLocaleUpperCase("pt-BR") + text.slice(1) : value;
}

/** Número para o campo de texto ("99.5" → "99,5"), sem separador de milhar. */
function numberText(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    useGrouping: false,
    maximumFractionDigits: 6,
  }).format(value);
}

/** Valor salvo (`characteristics`, `ruleValues`) → valor do formulário. */
export function templateValueToForm(value: unknown): TemplateFormValue {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number" && Number.isFinite(value)) {
    return numberText(value);
  }
  return typeof value === "string" ? value : "";
}

/** Valores salvos das chaves de `fields`, prontos para o formulário. */
export function templateValuesToForm(
  saved: Record<string, unknown> | null | undefined,
  keys?: Iterable<string>,
): TemplateFormValues {
  const out: TemplateFormValues = {};
  if (!saved) return out;
  const wanted = keys ? new Set(keys) : null;
  for (const [key, value] of Object.entries(saved)) {
    if (wanted && !wanted.has(key)) continue;
    const formValue = templateValueToForm(value);
    if (formValue.length) out[key] = formValue;
  }
  return out;
}

const isBlank = (value: TemplateFormValue | undefined) =>
  value === undefined ||
  (Array.isArray(value) ? value.length === 0 : value.trim() === "");

/**
 * Valor do formulário → valor da API, pelo tipo do campo. Vazio devolve
 * `undefined` (a chave não vai).
 */
export function templateFormToValue(
  field: CategoryTemplateField,
  value: TemplateFormValue | undefined,
): TemplateApiValue | undefined {
  if (isBlank(value)) return undefined;
  switch (field.type) {
    case "number":
    case "number_with_unit":
      return parseDecimal(String(value)) ?? undefined;
    case "boolean":
      return value === "true";
    case "multiple_choice":
      return Array.isArray(value) ? [...value] : [String(value)];
    default:
      return String(value).trim();
  }
}

/**
 * Erro (chave de tradução) do valor de um campo, ou `null`. Segue as regras
 * da marketplace-api para cada tipo, para o Seller ver o problema antes do
 * 422 `MKT_TEMPLATE_FIELD_INVALID`.
 */
export function templateFieldError(
  field: CategoryTemplateField,
  value: TemplateFormValue | undefined,
): string | null {
  if (isBlank(value)) {
    return field.required ? "SellerOfferCreate.errors.templateRequired" : null;
  }
  const text = Array.isArray(value) ? "" : value!.trim();

  switch (field.type) {
    case "number":
    case "number_with_unit": {
      const number = parseDecimal(text);
      if (number === null) return "SellerOfferCreate.errors.templateNumber";
      if (typeof field.min === "number" && number < field.min) {
        return "SellerOfferCreate.errors.templateRange";
      }
      if (typeof field.max === "number" && number > field.max) {
        return "SellerOfferCreate.errors.templateRange";
      }
      return null;
    }
    case "single_choice":
      return field.options?.includes(text)
        ? null
        : "SellerOfferCreate.errors.templateChoice";
    case "multiple_choice": {
      const list = Array.isArray(value) ? value : [text];
      const options = field.options ?? [];
      return list.every((item) => options.includes(item)) &&
        new Set(list).size === list.length
        ? null
        : "SellerOfferCreate.errors.templateChoice";
    }
    case "boolean":
      return text === "true" || text === "false"
        ? null
        : "SellerOfferCreate.errors.templateChoice";
    case "date":
      return /^\d{4}-\d{2}-\d{2}$/.test(text) &&
        !Number.isNaN(Date.parse(`${text}T00:00:00Z`))
        ? null
        : "SellerOfferCreate.errors.templateDate";
    case "link":
      if (!/^https?:\/\/\S+$/i.test(text)) {
        return "SellerOfferCreate.errors.templateUrl";
      }
      break;
    default:
      break;
  }

  const limit = Math.min(
    field.maxLength ?? Infinity,
    TEXT_LIMITS[field.type] ?? Infinity,
  );
  return text.length > limit ? "SellerOfferCreate.errors.templateTooLong" : null;
}

/** Erros por chave dos campos genéricos (vazio quando tudo vale). */
export function templateFieldsErrors(
  fields: CategoryTemplateField[],
  values: TemplateFormValues | null | undefined,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    const error = templateFieldError(field, values?.[field.key]);
    if (error) errors[field.key] = error;
  }
  return errors;
}

/** `characteristics` (ou `ruleValues.<regra>`) dos campos genéricos preenchidos. */
export function templateCharacteristics(
  fields: CategoryTemplateField[],
  values: TemplateFormValues | null | undefined,
): SpecificationCharacteristics {
  const out: SpecificationCharacteristics = {};
  for (const field of fields) {
    const value = templateFormToValue(field, values?.[field.key]);
    if (value !== undefined) out[field.key] = value;
  }
  return out;
}

/**
 * Template da categoria escolhida que o assistente usa ao salvar: os campos
 * genéricos (sem tela própria) e as regras condicionais.
 */
export interface OfferTemplate {
  fields: CategoryTemplateField[];
  rules: CategoryTemplateRule[];
}

export const EMPTY_OFFER_TEMPLATE: OfferTemplate = { fields: [], rules: [] };

/** Valores das regras no formulário: por regra, os campos de valor. */
export type RuleFormValues = Record<string, TemplateFormValues>;
/** Regras opcionais ligadas pelo Seller (as obrigatórias valem sempre). */
export type RuleToggles = Record<string, boolean>;

/** A regra entra na oferta: obrigatória, ou opcional ligada. */
export function isRuleOn(
  rule: CategoryTemplateRule,
  toggles: RuleToggles | null | undefined,
): boolean {
  return rule.required || !!toggles?.[rule.key];
}

/**
 * Erros das regras, por `regra.campo`. Regra ligada pede todos os campos de
 * valor (a API recusa regra pela metade: 422 `MKT_RULE_VALUES_INCOMPLETE`).
 */
export function ruleValuesErrors(
  rules: CategoryTemplateRule[],
  toggles: RuleToggles | null | undefined,
  values: RuleFormValues | null | undefined,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const rule of rules) {
    if (!isRuleOn(rule, toggles)) continue;
    for (const field of rule.valueFields) {
      const error = templateFieldError(
        { ...field, required: true },
        values?.[rule.key]?.[field.key],
      );
      if (error) errors[`${rule.key}.${field.key}`] = error;
    }
  }
  return errors;
}

/**
 * `ruleValues` da oferta: cada regra ligada com os valores; opcional
 * desligada vai `null` (desliga na edição). Sem regras, nada vai.
 */
export function buildRuleValues(
  rules: CategoryTemplateRule[],
  toggles: RuleToggles | null | undefined,
  values: RuleFormValues | null | undefined,
): OfferingRuleValues | undefined {
  if (!rules.length) return undefined;
  return Object.fromEntries(
    rules.map((rule) => [
      rule.key,
      isRuleOn(rule, toggles)
        ? templateCharacteristics(rule.valueFields, values?.[rule.key])
        : null,
    ]),
  );
}

/** `ruleValues` salvos na oferta → regras ligadas e valores do formulário. */
export function ruleValuesToForm(
  saved: OfferingRuleValues | null | undefined,
): { rulesEnabled: RuleToggles; ruleValues: RuleFormValues } {
  const rulesEnabled: RuleToggles = {};
  const ruleValues: RuleFormValues = {};
  for (const [key, value] of Object.entries(saved ?? {})) {
    if (!value) continue;
    rulesEnabled[key] = true;
    ruleValues[key] = templateValuesToForm(value);
  }
  return { rulesEnabled, ruleValues };
}
