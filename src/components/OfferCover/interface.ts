import type { IconType } from "react-icons";

import type { OfferCoverKind } from "@/types/offers";

export interface OfferCoverProps {
  kind: OfferCoverKind;
  /** Selo no canto (ex.: "Promoção da Semana"). */
  badge: string;
  /** Texto do centro; com `icon`, legenda clara abaixo dele. */
  caption: string;
  /** Sem ícone, a legenda vira o título da capa (ex.: "TOP 3 PROVEDORES"). */
  icon?: IconType;
  /** Selo "Patrocinada" à direita. */
  sponsoredLabel?: string;
  /** Desconto à direita (ex.: "-23%"). */
  discountLabel?: string;
}
