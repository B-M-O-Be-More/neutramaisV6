/**
 * Tamanhos da embalagem (RN-LOG-01, `shipping.packageSize`). Pequeno, Médio
 * e Grande preenchem as medidas (cm) e o peso (g), que o seller ainda pode
 * ajustar dentro do peso máximo do tamanho e do limite de mercado. Carga e
 * Personalizado: o seller digita.
 */
export const SHIPPING_PACKAGE_SIZES = [
  "small",
  "medium",
  "large",
  "cargo",
  "custom",
] as const;
export type ShippingPackageSize = (typeof SHIPPING_PACKAGE_SIZES)[number];

export interface ShippingPackagePreset {
  key: Extract<ShippingPackageSize, "small" | "medium" | "large">;
  heightCm: number;
  widthCm: number;
  lengthCm: number;
  weightG: number;
  /** Peso máximo do tamanho, em kg. */
  maxWeightKg: number;
}

/** Os mesmos valores da marketplace-api (`src/domain/package_size.py`). */
export const SHIPPING_PACKAGE_PRESETS: ShippingPackagePreset[] = [
  {
    key: "small",
    heightCm: 15,
    widthCm: 15,
    lengthCm: 15,
    weightG: 500,
    maxWeightKg: 1,
  },
  {
    key: "medium",
    heightCm: 30,
    widthCm: 30,
    lengthCm: 30,
    weightG: 3000,
    maxWeightKg: 5,
  },
  {
    key: "large",
    heightCm: 40,
    widthCm: 50,
    lengthCm: 60,
    weightG: 15000,
    maxWeightKg: 30,
  },
];

export function packagePreset(
  size: string | null | undefined,
): ShippingPackagePreset | undefined {
  return SHIPPING_PACKAGE_PRESETS.find((preset) => preset.key === size);
}

/**
 * Limite de mercado: acima de 30 kg, de 100 cm em um lado ou de 200 cm na
 * soma dos lados, o envio é frete de carga ou frete a combinar.
 */
export const MARKET_MAX_WEIGHT_KG = 30;
export const MARKET_MAX_SIDE_CM = 100;
export const MARKET_MAX_SIDES_SUM_CM = 200;
