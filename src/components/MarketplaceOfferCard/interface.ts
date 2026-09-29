import type { MarketplaceCategoryKey } from "@/components/MarketplaceCategories/interface";

/** Cor do valor de um indicador. */
export type MarketplaceOfferStatTone = "brand" | "success" | "neutral";

export interface MarketplaceOfferStat {
  /** Rótulo curto, exibido em caixa alta (ex.: "SLA técnico"). */
  label: string;
  /** Valor já formatado (ex.: "99,5%", "48h"). */
  value: string;
  /** Cor do valor. Default: "neutral". */
  tone?: MarketplaceOfferStatTone;
  /** Exibe o ícone de relógio antes do valor — usado em prazos. */
  showClock?: boolean;
}

export interface MarketplaceOfferSeller {
  /** Nome do provedor; as iniciais viram o avatar. */
  name: string;
  /** Cidade/UF ou abrangência (ex.: "Russas/CE", "Nacional"). */
  location?: string;
  /** Nota média de 0 a 5. */
  rating?: number;
  /** Quantidade de avaliações. */
  reviewCount?: number;
  /** Exibe o selo KYC quando o provedor está verificado. */
  isVerified?: boolean;
}

export interface MarketplaceOfferCardProps {
  /** Categoria: define gradiente, ícone e nome exibidos na capa. */
  category: MarketplaceCategoryKey;
  /** Nome da oferta. */
  title: string;
  /** Resumo da oferta. */
  description?: string;
  /** Destaque grande do card — ex.: { value: "500", unit: "Mbps" }. */
  headline: { value: string; unit?: string };
  /** Até três indicadores exibidos lado a lado. */
  stats: MarketplaceOfferStat[];
  /** Preço atual já formatado (ex.: "R$ 109,99"). */
  price: string;
  /** Sufixo do preço (ex.: "/mês"). */
  priceSuffix?: string;
  /** Preço anterior, riscado acima do atual. */
  previousPrice?: string;
  /** Observação sob o preço (ex.: câmbio). */
  priceNote?: string;
  /** Dados do provedor. Ausentes, o bloco do provedor mostra só o chip. */
  seller?: MarketplaceOfferSeller;
  /** Chip com categoria/subcategoria (ex.: "Conectividade · Fibra"). */
  categoryTag?: string;
  /** Selo no canto superior esquerdo da capa (ex.: "🔥 Mais Popular"). */
  highlightBadge?: string;
  /** Selo de desconto no canto superior direito (ex.: "-20%"). */
  discountBadge?: string;
  /** Destino do botão "Adicionar". */
  addHref: string;
  /** Destino do botão "Comprar agora". */
  buyHref: string;
}
