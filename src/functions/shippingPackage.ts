import {
  MARKET_MAX_SIDE_CM,
  MARKET_MAX_SIDES_SUM_CM,
  MARKET_MAX_WEIGHT_KG,
} from "@/data/shippingPackagePresets";
import { parseDecimal } from "@/functions/parseDecimal";

/**
 * O formulário guarda o peso em kg ("1,25"), como vai para a API; a etapa
 * Logística mostra em gramas ("1250"). "" fica "".
 */
export function kgToGramsText(kg: string | null | undefined): string {
  const value = parseDecimal(kg);
  return value === null ? "" : String(Math.round(value * 1000));
}

/** "1250" → "1,25"; "" fica "". Gramas inteiras dão no máximo 3 casas. */
export function gramsToKgText(grams: string | null | undefined): string {
  const value = parseDecimal(grams);
  if (value === null) return "";
  return String(Math.round(value) / 1000).replace(".", ",");
}

/** Peso (kg) e medidas (cm) do pacote como o formulário guarda. */
export interface ShippingPackageText {
  weightKg: string | null | undefined;
  heightCm: string | null | undefined;
  widthCm: string | null | undefined;
  lengthCm: string | null | undefined;
}

/**
 * O pacote passa do limite de mercado (30 kg, 100 cm em um lado ou 200 cm na
 * soma)? `null` enquanto peso ou medidas estão incompletos.
 */
export function exceedsMarketLimits(
  shippingPackage: ShippingPackageText,
): boolean | null {
  const weight = parseDecimal(shippingPackage.weightKg);
  const sides = [
    shippingPackage.heightCm,
    shippingPackage.widthCm,
    shippingPackage.lengthCm,
  ].map(parseDecimal);
  if (weight === null || sides.some((side) => side === null)) return null;
  const known = sides as number[];
  return (
    weight > MARKET_MAX_WEIGHT_KG ||
    Math.max(...known) > MARKET_MAX_SIDE_CM ||
    known.reduce((sum, side) => sum + side, 0) > MARKET_MAX_SIDES_SUM_CM
  );
}
