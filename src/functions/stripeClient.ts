import { loadStripe, type Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null> | null = null;

/** Chave publicável do Stripe (pública por definição; vazia sem configuração). */
export function stripePublishableKey(): string {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
}

/**
 * Stripe.js carregado uma vez por página. null sem chave publicável: o
 * pagamento com cartão fica indisponível e a tela avisa.
 */
export function getStripe(): Promise<Stripe | null> | null {
  const key = stripePublishableKey();
  if (!key) return null;
  stripePromise ??= loadStripe(key);
  return stripePromise;
}
