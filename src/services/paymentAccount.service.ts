// Service da conta de recebimento Stripe Connect do Seller (payment-api
// `/payment/onboarding` e `/payment/access`).
// Segue o padrão do SDD §12.2: funções nomeadas por operação, sem React, sem
// tratamento de erro (propaga AppError tipado para o hook chamador).
// O browser fala com o BFF (`/api/payment/*`), que anexa o Bearer da sessão de
// perfil Seller — em 401, renova o perfil uma vez e repete.

import { api } from "./api.client";
import { withProfileSession } from "./profileSession.service";

/** `GET /payment/access/{organization_id}`. Sem conta, tudo `false`. */
export interface PaymentAccess {
  hasAccount: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  /** Onboarding concluído: o Seller pode vender e receber. */
  isOnboarded: boolean;
}

/** Conta Stripe da organização (`POST /payment/onboarding` e `/refresh`). */
export interface PaymentOnboarding {
  organizationId: string;
  stripeAccountId: string | null;
  /** Link do formulário do Stripe; vence em minutos. */
  onboardingUrl: string | null;
  isOnboarded: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
}

export const paymentAccountService = {
  /** Situação da conta da organização. Qualquer membro lê. */
  getAccess: (organizationId: string, options: { signal?: AbortSignal } = {}) =>
    withProfileSession(() =>
      api.get<PaymentAccess>(
        `/payment/access/${encodeURIComponent(organizationId)}`,
        { signal: options.signal },
      ),
    ),

  /**
   * Cria (ou reabre) a conta e devolve um link novo do formulário do Stripe.
   * Só o `seller_owner` com MFA: 403 `seller_owner_required` ou
   * `mfa_required`. 400 quando a conta já está ativa.
   */
  startOnboarding: (email: string) =>
    withProfileSession(() =>
      api.post<PaymentOnboarding>("/payment/onboarding", { email }),
    ),

  /**
   * Lê de novo a conta no Stripe (depois que o Seller volta do formulário).
   * Mesmas travas do início; 404 sem onboarding iniciado.
   */
  refreshOnboarding: () =>
    withProfileSession(() =>
      api.post<PaymentOnboarding>("/payment/onboarding/refresh"),
    ),
};
