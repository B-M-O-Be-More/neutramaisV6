import type { IconType } from "react-icons";

export interface DashboardStatCardProps {
  label: string;
  value: string;
  caption: string;
  icon: IconType;
  /** Cor do ícone e do valor. */
  accentColor: string;
}
