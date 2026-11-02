/**
 * Vitrine de ofertas (Figma 2084-13767): campanhas, provedores em destaque e
 * listas personalizadas. A marketplace-api ainda não expõe campanhas,
 * reputação de provedor nem prazos de promoção: estes formatos são o que o
 * `useOffersShowcase` devolve até ela expor. Os rótulos vêm do i18n
 * (Offers.*).
 */

/** Gradiente e ícone da capa (cores das categorias do marketplace). */
export type OfferCoverKind = "connectivity" | "hardware" | "forYou";

/** Provedor com reputação e KYC (linha do card). */
export interface OfferProvider {
  name: string;
  /** 0–5. */
  rating: number;
  reviews: number;
  kycVerified: boolean;
}

/** Card de campanha: "Promoção da Semana", "Melhores Ofertas"... */
export interface CampaignOffer {
  id: string;
  /** Chave de `Offers.badges.*`. */
  badge: string;
  cover: OfferCoverKind;
  /** Selo "Patrocinada" na capa. */
  sponsored?: boolean;
  /** Desconto na capa, em % (ex.: 23 → "-23%"). */
  discountPercent?: number;
  provider: OfferProvider;
  /** Chave de `Offers.categories.*` (ex.: fiber, hardware). */
  category: string;
  /** Abrangência (ex.: "Nacional"); ausente, não aparece. */
  location?: string;
  title: string;
  /** ISO — fim da promoção ("Expira em…"). */
  expiresAt: string;
}

/** Card "Top 3 provedores" (destaque regional). */
export interface TopProvidersHighlight {
  providers: OfferProvider[];
}

/** Card "Para você": ofertas relacionadas ao histórico. */
export interface ForYouOffer {
  id: string;
  category: string;
  title: string;
}

export interface OffersShowcase {
  topProviders: TopProvidersHighlight;
  /** "Ofertas Especiais", ao lado do Top 3. */
  specials: CampaignOffer[];
  /** Faixa escura: melhores, para você, novas e da semana. */
  featured: CampaignOffer[];
  forYou: ForYouOffer[];
  /** Última faixa, ao lado do "Para você". */
  bestDeals: CampaignOffer[];
}
