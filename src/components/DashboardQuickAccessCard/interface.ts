import type { IconType } from "react-icons";

export interface DashboardQuickAccessCardProps {
  href: string;
  title: string;
  description: string;
  icon: IconType;
  /** Cores inicial e final do degradê de fundo. */
  gradient: [string, string];
  /** Contador no canto superior direito. Zero ou ausente = oculto. */
  count?: number;
}
