import type { ReactNode } from "react";
import type { IconType } from "react-icons";

export interface WithdrawStepHeadingProps {
  icon: IconType;
  title: string;
  subtitle: ReactNode;
  /** "identity": o cadeado da etapa do PIN, com a borda mais forte. */
  tone?: "default" | "identity";
}
