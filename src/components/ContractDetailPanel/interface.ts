import type { BoxProps } from "@chakra-ui/react";
import type { ReactNode } from "react";
import type { IconType } from "react-icons";

export interface ContractDetailPanelProps extends Omit<BoxProps, "title"> {
  title: ReactNode;
  icon?: IconType;
  iconColor?: string;
  /** `md`: coluna principal. `sm`: coluna lateral (Dados, Ações). */
  size?: "md" | "sm";
  /** Ao lado do título (ex.: contador). */
  headerExtra?: ReactNode;
  /** Na ponta direita do cabeçalho (ex.: "Novo aditivo"). */
  headerAction?: ReactNode;
  children: ReactNode;
}
