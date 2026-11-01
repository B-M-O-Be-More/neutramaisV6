import type { WithdrawalMode } from "@/services/withdrawal.service";

/**
 * Modalidades de saque (Figma 2215-23978): taxa em pontos-base sobre o valor
 * bruto. Normal cai no dia útil seguinte; Expresso, no mesmo dia até 17h.
 */
export const WITHDRAWAL_MODES: Record<WithdrawalMode, { rateBps: number }> = {
  normal: { rateBps: 150 },
  express: { rateBps: 350 },
};

/** Atalhos de valor do design (R$ 500, R$ 1.000, R$ 5.000). */
export const QUICK_AMOUNTS_MINOR = [50_000, 100_000, 500_000];

export interface WithdrawalBreakdown {
  grossMinor: number;
  feeMinor: number;
  netMinor: number;
}

/** Taxa (arredondada ao centavo) e líquido do saque. */
export function withdrawalBreakdown(
  grossMinor: number,
  mode: WithdrawalMode,
): WithdrawalBreakdown {
  const feeMinor = Math.round(
    (grossMinor * WITHDRAWAL_MODES[mode].rateBps) / 10_000,
  );
  return { grossMinor, feeMinor, netMinor: grossMinor - feeMinor };
}

/** "1,5%" no idioma da interface. */
export function formatRate(rateBps: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(rateBps / 10_000);
}

/** Dígitos digitados → centavos (a digitação preenche da direita). */
export function centsFromDigits(text: string): number {
  const digits = text.replace(/\D/g, "").slice(0, 13);
  return digits ? Number(digits) : 0;
}
