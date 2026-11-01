import type { ServiceOrderTechnician } from "@/types/serviceOrders";

export interface ServiceOrderTechniciansProps {
  technician?: ServiceOrderTechnician;
  /** OS aberta: o técnico ainda pode ser trocado. */
  canChange: boolean;
  /** "Alterar técnico". */
  onChange: () => void;
}
