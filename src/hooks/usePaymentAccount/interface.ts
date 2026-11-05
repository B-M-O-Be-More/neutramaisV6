import type { PaymentAccess } from "@/services/paymentAccount.service";

export type PaymentAccountAction = "start" | "refresh";

export interface UsePaymentAccountReturn {
  /** Situação da conta; null enquanto carrega ou se a leitura falhou. */
  access: PaymentAccess | null;
  isLoading: boolean;
  /** Chave de tradução da falha ao ler a situação. */
  loadErrorKey?: string;
  reload: () => void;
  /** Ação em andamento (iniciar ou atualizar no Stripe). */
  pendingAction: PaymentAccountAction | null;
  /** Chave de tradução da falha da última ação. */
  actionErrorKey?: string;
  /** A ação pediu MFA: abra o step-up e chame `retry` ao confirmar. */
  needsMfa: boolean;
  /** Abre o formulário do Stripe (cria a conta na primeira vez). */
  start: (email: string) => Promise<void>;
  /** Lê de novo a conta no Stripe (depois de voltar do formulário). */
  refresh: () => Promise<void>;
  /** Repete a ação que pediu MFA. */
  retry: () => Promise<void>;
  /** Desiste do step-up. */
  dismissMfa: () => void;
}
