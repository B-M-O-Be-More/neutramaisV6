import type { ReactNode } from "react";

/** Cores do painel (as mesmas da categoria em `OFFER_CATEGORIES`). */
export interface OfferCategoryPanelTone {
  fg: string;
  bg: string;
  border: string;
}

export interface OfferCategoryPanelProps {
  /** `id` do título — rotula o grupo. */
  id: string;
  title: string;
  tone: OfferCategoryPanelTone;
  children: ReactNode;
}

export interface OfferPanelFieldProps {
  /** `id` do controle — liga o rótulo e o erro a ele. */
  id: string;
  label: string;
  required?: boolean;
  /** Mensagem de erro (já traduzida). */
  error?: string;
  children: ReactNode;
}
