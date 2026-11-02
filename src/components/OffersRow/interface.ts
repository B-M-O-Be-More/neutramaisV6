import type { ReactNode } from "react";

export interface OffersRowProps {
  /** Nome acessível da faixa (ex.: "Ofertas especiais"). */
  label: string;
  /** `dark`: faixa com fundo roxo-escuro (Figma 2084-20916). */
  tone?: "plain" | "dark";
  /** Cards, já com largura fixa. */
  children: ReactNode;
}
