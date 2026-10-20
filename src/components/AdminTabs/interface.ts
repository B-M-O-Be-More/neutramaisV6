export type AdminTabKey = "kyc" | "users" | "feeSchedule" | "audit";

export interface AdminTabsProps {
  active: AdminTabKey;
  /** Abas já construídas; as demais aparecem desabilitadas. */
  available: AdminTabKey[];
  onChange: (tab: AdminTabKey) => void;
  /** Contador da aba KYC (pendentes); zero ou ausente = oculto. */
  kycCount?: number | null;
}
