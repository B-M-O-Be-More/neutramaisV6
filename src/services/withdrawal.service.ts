// Saque do seller (RN-PAG-04, atualização de 28/10/2026): sem valor mínimo,
// o seller paga a taxa, exige 2FA por app autenticador (TOTP) e vai só para
// a conta de recebimento cadastrada.
//
// Nenhuma API da Neutra+ tem hoje a rota de saque nem a de contas de
// recebimento (a payment-api só fecha o repasse mensal, sem rota HTTP). O
// fluxo da tela está pronto e chama `request`; até a rota existir, ela recusa
// com `WithdrawalUnavailableError` — nenhum valor é movimentado.

export type WithdrawalMode = "normal" | "express";

/** Conta de recebimento (destino do saque). */
export interface PayoutAccount {
  id: string;
  method: "pix" | "bank";
  /** Ex.: "PIX · Chave CNPJ", "Itaú · Conta corrente". */
  title: string;
  /** Ex.: a chave ou "Ag 0341 · CC 12345-6". */
  detail: string;
  isDefault: boolean;
  /** pending: conta nova ainda não verificada — saídas bloqueadas. */
  status: "active" | "pending";
}

export interface WithdrawalRequest {
  amountMinor: number;
  currency: string;
  mode: WithdrawalMode;
  accountId: string;
  /** Código de 6 dígitos do app autenticador. */
  totp: string;
}

export interface WithdrawalReceipt {
  /** Protocolo para acompanhamento (ex.: "SAQ-2026-008811"). */
  protocol: string;
}

/** O backend ainda não oferece a rota de saque. */
export class WithdrawalUnavailableError extends Error {
  constructor() {
    super("Withdrawal endpoint not available");
    this.name = "WithdrawalUnavailableError";
  }
}

export const withdrawalService = {
  /** Solicita o saque. Hoje sempre recusa: não há rota no backend. */
  request: async (input: WithdrawalRequest): Promise<WithdrawalReceipt> => {
    void input;
    throw new WithdrawalUnavailableError();
  },
};
