import type { Control } from "react-hook-form";

import type { SellerOfferValues } from "@/schemas/sellerOffer";

/** Resultado da última tentativa de publicar, para exibir na revisão. */
export interface SellerOfferPublishNotice {
  tone: "error" | "warning";
  /** Mensagens já traduzidas. */
  messages: string[];
  /** A oferta já existe (rascunho) — mostra o atalho para Minhas Ofertas. */
  savedAsDraft?: boolean;
}

export interface SellerOfferReviewStepProps {
  control: Control<SellerOfferValues>;
  /** Idioma para moeda e datas (ex.: "pt-BR"). */
  locale: string;
  notice?: SellerOfferPublishNotice | null;
}
