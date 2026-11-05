import type { TrendingCategory } from "@/functions/offers";

export interface TrendingProductCardProps {
  /** Posição no ranking (1 = mais contratado). */
  rank: number;
  title: string;
  category: TrendingCategory;
  /** Preço já formatado (ex.: "R$ 109,99"). */
  price: string;
  /** Sufixo do preço (ex.: "/mês"); serviços recorrentes. */
  priceSuffix?: string;
  /** Oferta patrocinada (impulsionada pelo seller). */
  sponsored: boolean;
  /** "Adicionar" ao carrinho. */
  addHref: string;
}
