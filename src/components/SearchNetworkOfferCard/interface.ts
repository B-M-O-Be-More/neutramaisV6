import type { MarketplaceCategoryKey } from "@/components/MarketplaceCategories/interface";

/** Cor do valor de um indicador. */
export type SearchNetworkOfferStatTone = "neutral" | "success";

export interface SearchNetworkOfferStat {
  /** Rótulo curto, exibido em caixa alta (ex.: "SLA"). */
  label: string;
  /** Valor já formatado (ex.: "99,5%", "48h"). */
  value: string;
  tone?: SearchNetworkOfferStatTone;
  /** Exibe o relógio antes do valor — usado em prazos. */
  showClock?: boolean;
}

/** Cor do selo do canto superior esquerdo da capa. */
export type SearchNetworkOfferBadgeTone =
  | "brand"
  | "violet"
  | "success"
  | "warning";

export interface SearchNetworkOfferSeller {
  name: string;
  /** Nota média de 0 a 5. */
  rating?: number;
  reviewCount?: number;
  /** Exibe o selo KYC quando o provedor está verificado. */
  isVerified?: boolean;
}

export interface SearchNetworkOfferCardProps {
  /** Define gradiente, ícone e nome da capa. */
  category: MarketplaceCategoryKey;
  /** Selo da capa (ex.: "Mais Popular"). */
  highlightBadge?: { label: string; tone?: SearchNetworkOfferBadgeTone };
  /** Selo de desconto (ex.: "-20%"). */
  discountBadge?: string;
  /** Ausente, a linha do provedor não é exibida. */
  seller?: SearchNetworkOfferSeller;
  /** Tipo de serviço, exibido em caixa alta (ex.: "Fibra óptica"). */
  serviceType: string;
  /** Abrangência (ex.: "Russas/CE", "Nacional"). */
  location?: string;
  title: string;
  /** Destaque técnico — ex.: { value: "500", unit: "Mbps" }. */
  headline: { value: string; unit?: string };
  /** Até três indicadores. */
  stats: SearchNetworkOfferStat[];
  /** Preço atual já formatado (ex.: "R$ 109,99"). */
  price: string;
  /** Sufixo do preço (ex.: "/mês"). */
  priceSuffix?: string;
  /** Preço anterior, riscado acima do atual. */
  previousPrice?: string;
  addHref: string;
  proposalHref: string;
}
