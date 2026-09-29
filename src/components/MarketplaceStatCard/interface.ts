import type { IconType } from "react-icons";

export interface MarketplaceStatCardProps {
  /** Rótulo da métrica — renderizado em caixa alta. */
  label: string;
  /**
   * Valor já formatado para exibição (ex.: "R$ 142M", "98,2%", "2m 47s").
   * A formatação fica a cargo de quem consome a API, para o card seguir
   * puramente apresentacional.
   */
  value: string;
  /** Legenda curta abaixo do valor (ex.: "últimos 12 meses"). */
  caption: string;
  /** Cor de destaque aplicada ao valor e ao ícone. */
  accentColor: string;
  /** Ícone exibido ao lado do rótulo. Padrão: tendência de alta. */
  icon?: IconType;
  /** Enquanto true, exibe um esqueleto no lugar do valor. */
  isLoading?: boolean;
}
