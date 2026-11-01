import type { ServiceOrderTechnicianValues } from "@/schemas/serviceOrders";

export interface FormServiceOrderTechnicianProps {
  /** Texto da ação principal ("Adicionar ou iniciar execução"). */
  confirmLabel: string;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (values: ServiceOrderTechnicianValues) => void;
}
