/** Cor do selo ao lado do nome da oferta. */
export type DashboardOfferTagTone = "brand" | "success" | "seller";

export interface DashboardFeaturedOffer {
  id: string;
  title: string;
  /** Selo opcional — ex.: { label: "Setup Grátis", tone: "success" }. */
  tag?: { label: string; tone: DashboardOfferTagTone };
  provider: string;
  category: string;
  /** SLA já formatado — ex.: "99,5%". Ausente, exibe "—". */
  sla?: string;
  /** Preço já formatado — ex.: "R$ 99,90". */
  price: string;
  /** Cobrança mensal: acrescenta o sufixo "/mês" ao preço. */
  isMonthly?: boolean;
  /** Destino do "Comprar". */
  href: string;
}

export interface DashboardFeaturedOffersProps {
  offers: DashboardFeaturedOffer[];
  /** Destino do "Ver todas". */
  viewAllHref: string;
}
