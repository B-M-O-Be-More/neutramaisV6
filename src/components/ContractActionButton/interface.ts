import type { ButtonProps } from "@chakra-ui/react";
import type { IconType } from "react-icons";

/** `primary`: roxo (assinar). `neutral`: contorno cinza. `danger`: vermelho. */
export type ContractActionButtonTone = "primary" | "neutral" | "danger";

export interface ContractActionButtonProps extends Omit<
  ButtonProps,
  "asChild"
> {
  tone: ContractActionButtonTone;
  icon?: IconType;
  /** Vira um link (ex.: "Ver detalhes"). */
  href?: string;
  /** Largura toda e altura fixa do card "Ações" do detalhe. */
  block?: boolean;
}
