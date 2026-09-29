import type { IconType } from "react-icons";

/** Paletas disponíveis para o quadro do ícone da etapa. */
export type MarketplaceHowItWorksStepTone =
  | "blue"
  | "violet"
  | "emerald"
  | "amber";

export interface MarketplaceHowItWorksStepProps {
  /** Ícone da etapa, exibido no quadro superior. */
  icon: IconType;
  /** Posição da etapa no fluxo, exibida no marcador circular. */
  step: number;
  /** Nome da etapa. */
  title: string;
  /** Explicação curta do que acontece na etapa. */
  description: string;
  /** Paleta do quadro do ícone. */
  tone: MarketplaceHowItWorksStepTone;
}
