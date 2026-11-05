"use client";

import React from "react";

import { ApiError, NotFoundError, upstreamErrorCode } from "@/services/errors";
import {
  paymentAccountService,
  type PaymentAccess,
  type PaymentOnboarding,
} from "@/services/paymentAccount.service";

import type {
  PaymentAccountAction,
  UsePaymentAccountReturn,
} from "./interface";

/** Última leitura, marcada com a tentativa que a originou. */
interface AccessResult {
  key: string;
  access: PaymentAccess | null;
  hasError: boolean;
}

/** Ação que pediu MFA, para repetir depois do step-up. */
interface PendingMfa {
  action: PaymentAccountAction;
  email?: string;
}

/** Falha de iniciar ou atualizar a conta → chave de tradução. */
function actionErrorKey(error: unknown): string {
  if (upstreamErrorCode(error) === "seller_owner_required") {
    return "SellerPaymentAccount.errors.ownerOnly";
  }
  if (error instanceof NotFoundError) {
    return "SellerPaymentAccount.errors.notStarted";
  }
  if (error instanceof ApiError && error.status >= 500) {
    return "SellerPaymentAccount.errors.stripeUnavailable";
  }
  return "SellerPaymentAccount.errors.failed";
}

/** Resposta do onboarding → situação da conta. */
const accessOf = (result: PaymentOnboarding): PaymentAccess => ({
  hasAccount: !!result.stripeAccountId,
  chargesEnabled: result.chargesEnabled,
  payoutsEnabled: result.payoutsEnabled,
  isOnboarded: result.isOnboarded,
});

/**
 * Conta de recebimento Stripe Connect do Seller (payment-api): lê a situação
 * (`/payment/access`), abre o formulário do Stripe (`/payment/onboarding`) e
 * atualiza a situação quando o Seller volta (`/payment/onboarding/refresh`).
 *
 * Iniciar e atualizar exigem o Dono com MFA na sessão: 403 `mfa_required`
 * marca `needsMfa`, e `retry` repete a ação depois do step-up. Quem volta do
 * Stripe com o cadastro pendente tem a situação atualizada sozinha, uma vez
 * (sem pedir MFA: se a sessão não tem, fica o botão "Atualizar status").
 */
export function usePaymentAccount(
  organizationId: string | null,
  { isOwner }: { isOwner: boolean },
): UsePaymentAccountReturn {
  const [attempt, setAttempt] = React.useState(0);
  const [result, setResult] = React.useState<AccessResult | null>(null);
  // Situação lida pelo refresh do onboarding, mais nova que a do GET.
  const [refreshed, setRefreshed] = React.useState<{
    key: string;
    access: PaymentAccess;
  } | null>(null);
  const [pendingAction, setPendingAction] =
    React.useState<PaymentAccountAction | null>(null);
  const [errorKey, setErrorKey] = React.useState<string>();
  const [pendingMfa, setPendingMfa] = React.useState<PendingMfa | null>(null);
  const autoRefreshed = React.useRef(false);
  const key = `${organizationId}:${attempt}`;

  React.useEffect(() => {
    if (!organizationId) return;
    const controller = new AbortController();
    paymentAccountService
      .getAccess(organizationId, { signal: controller.signal })
      .then((access) =>
        setResult({ key, access: access ?? null, hasError: false }),
      )
      .catch(() => {
        if (controller.signal.aborted) return;
        setResult({ key, access: null, hasError: true });
      });
    return () => controller.abort();
  }, [organizationId, key]);

  const current = result?.key === key ? result : null;
  const access =
    refreshed?.key === key ? refreshed.access : (current?.access ?? null);

  const perform = async (action: PaymentAccountAction, email?: string) => {
    setPendingAction(action);
    setErrorKey(undefined);
    try {
      if (action === "start") {
        const started = await paymentAccountService.startOnboarding(email!);
        // O formulário do Stripe devolve o Seller para a URL de retorno da
        // payment-api; o link vence em minutos, por isso abre na hora.
        if (started?.onboardingUrl) {
          window.location.assign(started.onboardingUrl);
        }
      } else {
        const updated = await paymentAccountService.refreshOnboarding();
        if (updated) setRefreshed({ key, access: accessOf(updated) });
      }
    } catch (error) {
      if (upstreamErrorCode(error) === "mfa_required") {
        setPendingMfa({ action, email });
      } else if (error instanceof ApiError && error.status === 400) {
        // Conta já ativa: a situação lida estava velha.
        setAttempt((n) => n + 1);
      } else {
        setErrorKey(actionErrorKey(error));
      }
    } finally {
      setPendingAction(null);
    }
  };

  // Cadastro pendente: o Seller pode estar voltando do Stripe. Atualiza uma
  // vez, sem abrir o step-up se a sessão não tiver MFA.
  React.useEffect(() => {
    if (!isOwner || autoRefreshed.current) return;
    if (!access?.hasAccount || access.isOnboarded) return;
    autoRefreshed.current = true;
    paymentAccountService
      .refreshOnboarding()
      .then((updated) => {
        if (updated) setRefreshed({ key, access: accessOf(updated) });
      })
      .catch(() => undefined);
  }, [access, isOwner, key]);

  return {
    access,
    isLoading: !!organizationId && !current,
    loadErrorKey: current?.hasError
      ? "SellerPaymentAccount.errors.loadFailed"
      : undefined,
    reload: () => setAttempt((n) => n + 1),
    pendingAction,
    actionErrorKey: errorKey,
    needsMfa: pendingMfa !== null,
    start: (email) => perform("start", email),
    refresh: () => perform("refresh"),
    retry: async () => {
      const pending = pendingMfa;
      // Fecha o step-up; se a ação pedir MFA de novo, ele reabre.
      setPendingMfa(null);
      if (pending) await perform(pending.action, pending.email);
    },
    dismissMfa: () => setPendingMfa(null),
  };
}
