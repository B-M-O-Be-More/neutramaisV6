import type { AdminTabKey } from "@/components/AdminTabs";

export interface AdminPanelHeaderProps {
  /** Organizações aguardando revisão de KYC; null enquanto carrega. */
  pendingKyc: number | null;
  active: AdminTabKey;
  onTabChange: (tab: AdminTabKey) => void;
}
