"use client";

import React from "react";

import {
  addressErrors as findAddressErrors,
  buildCheckoutBody,
  checkoutErrorKey,
  EMPTY_ADDRESS,
  isMfaRequired,
  newIdempotencyKey,
  normalizePostalCode,
  shippingMinor,
  type ShippingAddressDraft,
} from "@/functions/checkoutBody";
import {
  checkoutService,
  type Checkout,
  type CheckoutPayment,
  type OperationProgress,
  type ShippingOption,
} from "@/services/checkout.service";
import { ApiError, RateLimitError, upstreamErrorCode } from "@/services/errors";
import { myMfaService } from "@/services/myMfa.service";

import type {
  CheckoutOutcome,
  CheckoutStep,
  QuoteState,
  UseCheckoutFlowParams,
  UseCheckoutFlowReturn,
} from "./interface";

const STORAGE_PREFIX = "neutramais.checkout.";
/** Teto do acompanhamento do pagamento antes de mostrar "em processamento". */
const PAYMENT_POLL_LIMIT_MS = 60_000;

/**
 * Chave do checkout para este corpo. O mesmo corpo repete a mesma chave (a
 * orders-api devolve o mesmo checkout); um corpo diferente pede chave nova,
 * senão a API recusa com 409 ("Idempotency key already belongs…").
 */
function checkoutKeyFor(organizationId: string, body: string): string {
  const storageKey = `${STORAGE_PREFIX}${organizationId}`;
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey) ?? "null") as {
      body?: string;
      key?: string;
    } | null;
    if (saved?.body === body && saved.key) return saved.key;
  } catch {
    // Sem storage: a chave vale só nesta tentativa.
  }
  const key = newIdempotencyKey("chk");
  try {
    sessionStorage.setItem(storageKey, JSON.stringify({ body, key }));
  } catch {
    // Idem.
  }
  return key;
}

function forgetCheckoutKey(organizationId: string) {
  try {
    sessionStorage.removeItem(`${STORAGE_PREFIX}${organizationId}`);
  } catch {
    // Sem storage: nada guardado.
  }
}

/** Erro do step-up → chave de `MfaStepUp.errors` (mesma do diálogo). */
function stepUpErrorKey(error: unknown): string {
  const code = upstreamErrorCode(error);
  if (code === "INVALID_MFA_CODE") return "MfaStepUp.errors.invalidCode";
  if (code === "MFA_ENROLLMENT_REQUIRED") {
    return "Checkout.errors.mfaEnrollment";
  }
  if (error instanceof RateLimitError) return "MfaStepUp.errors.rateLimited";
  if (error instanceof ApiError && error.status === 401) {
    return "MfaStepUp.errors.invalidCode";
  }
  return "MfaStepUp.errors.failed";
}

function outcomeOf(progress: OperationProgress): CheckoutOutcome | null {
  switch (progress.status) {
    case "succeeded":
    case "completed_with_cancellations":
      return "success";
    case "cancelled":
    case "action_required":
      return "error";
    default:
      return null;
  }
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fluxo do checkout em 5 passos (Figma "Checkout e pagamento"): resumo com
 * endereço e frete, método (cartão e crédito Neutra+), verificação do
 * autenticador, pagamento com cartão no Stripe e resultado.
 *
 * Só produto físico por enquanto: serviço precisa da evidência de
 * viabilidade da Geo (D-01).
 */
export function useCheckoutFlow({
  organizationId,
  lines,
  currency,
  availableCreditMinor,
  defaultAddress,
  onCompleted,
}: UseCheckoutFlowParams): UseCheckoutFlowReturn {
  const [step, setStep] = React.useState<CheckoutStep>(1);
  const [address, setAddress] =
    React.useState<ShippingAddressDraft>(EMPTY_ADDRESS);
  const [showAddressErrors, setShowAddressErrors] = React.useState(false);
  // Cada cotação guarda para qual CEP e quantidades foi feita: a de outra
  // chave conta como "carregando" (sem setState síncrono no effect).
  const [quoteResults, setQuoteResults] = React.useState<
    Record<string, (QuoteState & { forKey: string }) | undefined>
  >({});
  const [shipping, setShipping] = React.useState<
    Record<string, ShippingOption | undefined>
  >({});
  const [acceptedTerms, setAcceptedTerms] = React.useState(false);
  const [useCredit, setUseCredit] = React.useState(false);
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [checkout, setCheckout] = React.useState<Checkout | null>(null);
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const [outcome, setOutcome] = React.useState<CheckoutOutcome | null>(null);
  const [errorKey, setErrorKey] = React.useState<string>();
  const [errorMessage, setErrorMessage] = React.useState<string>();

  const onCompletedRef = React.useRef(onCompleted);
  React.useEffect(() => {
    onCompletedRef.current = onCompleted;
  }, [onCompleted]);

  // Endereço legal da organização como ponto de partida, uma vez.
  const prefilled = React.useRef(false);
  React.useEffect(() => {
    if (prefilled.current || !defaultAddress) return;
    prefilled.current = true;
    setAddress((current) => ({ ...current, ...defaultAddress }));
  }, [defaultAddress]);

  // Cotação de frete de cada produto físico quando o CEP fica válido.
  const postalCode = normalizePostalCode(address.postalCode);
  const physical = lines.filter(
    (line) => line.snapshot.productType === "physical",
  );
  const quoteKey = physical
    .map((line) => `${line.entry.offeringId}:${line.entry.quantity}`)
    .join(",");
  const requestKey = postalCode && quoteKey ? `${postalCode}|${quoteKey}` : "";
  React.useEffect(() => {
    if (!requestKey) return;
    const controller = new AbortController();
    const [destinationPostalCode, pairs] = requestKey.split("|");
    const requests = pairs.split(",").map((pair) => {
      const [offeringId, quantity] = pair.split(":");
      return { offeringId, quantity: Number(quantity) };
    });

    for (const { offeringId, quantity } of requests) {
      checkoutService
        .quoteShipping(
          offeringId,
          { destinationPostalCode, quantity },
          { signal: controller.signal },
        )
        .then((quote) => {
          setQuoteResults((current) => ({
            ...current,
            [offeringId]: { status: "ready", quote, forKey: requestKey },
          }));
          // Mantém a escolha se ela ainda existe; senão, a mais barata.
          setShipping((current) => {
            const options = quote.options.filter(
              (option) => shippingMinor(option) !== null,
            );
            const kept = options.find(
              (option) => option.serviceId === current[offeringId]?.serviceId,
            );
            return { ...current, [offeringId]: kept ?? options[0] };
          });
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          setQuoteResults((current) => ({
            ...current,
            [offeringId]: { status: "error", quote: null, forKey: requestKey },
          }));
          setShipping((current) => ({ ...current, [offeringId]: undefined }));
        });
    }

    return () => controller.abort();
  }, [requestKey]);

  const quotes: Record<string, QuoteState | undefined> = {};
  for (const line of physical) {
    const result = quoteResults[line.entry.offeringId];
    quotes[line.entry.offeringId] =
      result && result.forKey === requestKey
        ? { status: result.status, quote: result.quote }
        : { status: "loading", quote: null };
  }

  const productsMinor = lines.reduce(
    (sum, line) => sum + (line.price?.totalMinor ?? 0),
    0,
  );
  // Frete só vale se veio da cotação do CEP e das quantidades atuais.
  const currentShipping: Record<string, ShippingOption | undefined> = {};
  for (const line of physical) {
    const id = line.entry.offeringId;
    currentShipping[id] =
      quotes[id]?.status === "ready" ? shipping[id] : undefined;
  }
  const shippingTotalMinor = physical.reduce((sum, line) => {
    const option = currentShipping[line.entry.offeringId];
    return sum + (option ? (shippingMinor(option) ?? 0) : 0);
  }, 0);
  const estimatedTotalMinor = productsMinor + shippingTotalMinor;
  const creditMinor =
    useCredit && availableCreditMinor
      ? Math.min(availableCreditMinor, estimatedTotalMinor)
      : 0;
  const cardMinor = Math.max(0, estimatedTotalMinor - creditMinor);

  const addressErrors = findAddressErrors(address);
  const built = buildCheckoutBody(lines, address, currentShipping, creditMinor);
  const summaryProblem =
    "problem" in built
      ? built.problem
      : !acceptedTerms
        ? ("acceptTerms" as const)
        : null;

  const clearError = () => {
    setErrorKey(undefined);
    setErrorMessage(undefined);
  };

  const finish = (result: CheckoutOutcome) => {
    setOutcome(result);
    setStep(5);
    if (result !== "error") {
      if (organizationId) forgetCheckoutKey(organizationId);
      onCompletedRef.current();
    }
  };

  /** Acompanha o pagamento até um estado final ou o teto de espera. */
  const followPayment = async (checkoutId: string) => {
    const startedAt = Date.now();
    while (Date.now() - startedAt < PAYMENT_POLL_LIMIT_MS) {
      try {
        const progress = await checkoutService.paymentProgress(checkoutId);
        const result = outcomeOf(progress);
        if (result) return finish(result);
        await wait((progress.pollAfterSeconds ?? 3) * 1000);
      } catch {
        await wait(3000);
      }
    }
    finish("pending");
  };

  /** Resultado do POST /payment → próximo passo. */
  const handlePayment = (payment: CheckoutPayment, checkoutId: string) => {
    if (payment.status === "confirmed") return finish("success");
    if (payment.status === "cancelled") return finish("error");
    if (payment.clientSecret) {
      setClientSecret(payment.clientSecret);
      setStep(4);
      return;
    }
    // Sem segredo (Stripe fora ou a API não leu o PaymentIntent): acompanha.
    setStep(5);
    void followPayment(checkoutId);
  };

  const verify = async (totpCode: string) => {
    if (isVerifying || !organizationId || "problem" in built) return;
    setIsVerifying(true);
    clearError();

    try {
      await myMfaService.stepUp(totpCode);
    } catch (error) {
      setErrorKey(stepUpErrorKey(error));
      setIsVerifying(false);
      return;
    }

    // Pedido já gravado: a falha daqui em diante é só do pagamento.
    let orderCreated = false;
    try {
      const key = checkoutKeyFor(organizationId, JSON.stringify(built.body));
      const created = await checkoutService.create(built.body, key);
      setCheckout(created);
      orderCreated = true;

      if (created.status === "awaitingApproval") {
        finish("approval");
        return;
      }

      const funding = await checkoutService.authorizeFunding(
        created.checkoutId,
      );
      const payment = await checkoutService.pay(
        {
          checkoutId: funding.checkoutId,
          authorization: funding.authorization,
        },
        `pay-${created.checkoutId}`,
      );
      handlePayment(payment, created.checkoutId);
    } catch (error) {
      const key = isMfaRequired(error)
        ? "Checkout.errors.mfa"
        : checkoutErrorKey(error);
      // O mesmo carrinho repete a mesma chave: tentar de novo reaproveita o
      // pedido criado e só refaz a autorização e a cobrança.
      setErrorKey(
        orderCreated && key === "Checkout.errors.unavailable"
          ? "Checkout.errors.paymentUnavailable"
          : key,
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const goTo = (target: CheckoutStep) => {
    // Só volta para passos já feitos, antes de gravar o checkout.
    if (target < step && step <= 3) {
      clearError();
      setStep(target);
    }
  };

  return {
    step,
    goTo,
    address,
    setAddressField: (field, value) =>
      setAddress((current) => ({ ...current, [field]: value })),
    addressErrors,
    showAddressErrors,
    quotes,
    shipping: currentShipping,
    selectShipping: (offeringId, option) =>
      setShipping((current) => ({ ...current, [offeringId]: option })),
    acceptedTerms,
    setAcceptedTerms,
    productsMinor,
    shippingTotalMinor,
    estimatedTotalMinor,
    useCredit,
    setUseCredit,
    creditMinor,
    cardMinor,
    summaryProblem,
    continueFromSummary: () => {
      setShowAddressErrors(true);
      if (summaryProblem || !currency) return;
      clearError();
      setStep(2);
    },
    continueFromMethod: () => {
      clearError();
      setStep(3);
    },
    verify,
    isVerifying,
    checkout,
    clientSecret,
    onCardConfirmed: () => {
      if (!checkout) return;
      setStep(5);
      void followPayment(checkout.checkoutId);
    },
    onCardFailed: (message) => {
      setErrorKey("Checkout.errors.cardDeclined");
      setErrorMessage(message);
    },
    outcome,
    errorKey,
    errorMessage,
    restart: () => {
      if (organizationId) forgetCheckoutKey(organizationId);
      clearError();
      setCheckout(null);
      setClientSecret(null);
      setOutcome(null);
      setStep(1);
    },
  };
}
