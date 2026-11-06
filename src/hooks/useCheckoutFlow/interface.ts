import type {
  AddressField,
  CheckoutBodyProblem,
  ShippingAddressDraft,
} from "@/functions/checkoutBody";
import type { CartLine } from "@/functions/cartView";
import type {
  Checkout,
  ShippingOption,
  ShippingQuote,
} from "@/services/checkout.service";

export type CheckoutStep = 1 | 2 | 3 | 4 | 5;

export type CheckoutOutcome =
  /** Pagamento confirmado: pedidos em escrow, aguardando o Seller. */
  | "success"
  /** Ainda processando (cartão em análise, conciliação). */
  | "pending"
  /** Acima da alçada: aguarda o Dono ou o Financeiro (72h). */
  | "approval"
  /** O cartão foi recusado ou o pagamento cancelado. */
  | "error";

export interface QuoteState {
  status: "loading" | "ready" | "error";
  quote: ShippingQuote | null;
}

export interface UseCheckoutFlowParams {
  organizationId: string | null;
  /** Linhas do carrinho que podem seguir (sem problema e com preço). */
  lines: CartLine[];
  currency: string | null;
  /** Saldo disponível da carteira na moeda, em centavos (null sem saldo). */
  availableCreditMinor: number | null;
  /** Endereço legal da organização, para preencher o de entrega. */
  defaultAddress: Partial<ShippingAddressDraft> | null;
  /** Chamado quando os pedidos foram gravados e pagos (ou aguardam). */
  onCompleted: () => void;
}

export interface UseCheckoutFlowReturn {
  step: CheckoutStep;
  goTo: (step: CheckoutStep) => void;

  address: ShippingAddressDraft;
  setAddressField: (field: keyof ShippingAddressDraft, value: string) => void;
  addressErrors: AddressField[];
  /** Mostrar os erros do endereço (depois da 1ª tentativa de seguir). */
  showAddressErrors: boolean;

  quotes: Record<string, QuoteState | undefined>;
  shipping: Record<string, ShippingOption | undefined>;
  selectShipping: (offeringId: string, option: ShippingOption) => void;

  acceptedTerms: boolean;
  setAcceptedTerms: (accepted: boolean) => void;

  productsMinor: number;
  shippingTotalMinor: number;
  /** Produtos + frete (a taxa da plataforma vem no checkout criado). */
  estimatedTotalMinor: number;

  useCredit: boolean;
  setUseCredit: (useCredit: boolean) => void;
  creditMinor: number;
  /** O que sobra para o cartão. */
  cardMinor: number;

  /** Motivo de não poder seguir do passo 1 (null = pode). */
  summaryProblem: CheckoutBodyProblem | "acceptTerms" | null;
  continueFromSummary: () => void;
  continueFromMethod: () => void;

  /** Passo 3: prova o MFA, grava o checkout e prepara o pagamento. */
  verify: (totpCode: string) => Promise<void>;
  isVerifying: boolean;

  checkout: Checkout | null;
  /** Passo 4: segredo do PaymentIntent para o Stripe.js. */
  clientSecret: string | null;
  /** Passo 4: o Stripe confirmou o cartão; acompanha até o fim. */
  onCardConfirmed: () => void;
  onCardFailed: (message?: string) => void;

  outcome: CheckoutOutcome | null;
  errorKey: string | undefined;
  errorMessage: string | undefined;
  /** Volta ao passo 1 com uma nova tentativa (nova chave). */
  restart: () => void;
}
