import type { ReactNode } from "react";

export interface ProfileCardProps {
  title: string;
  /** À direita do título (selo, link). */
  titleEnd?: ReactNode;
  /** "danger": a zona de perigo, em vermelho. */
  tone?: "default" | "danger";
  children: ReactNode;
}
