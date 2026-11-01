import type { ServiceOrderPostponeValues } from "@/schemas/serviceOrders";

export interface FormServiceOrderPostponeProps {
  /** Data e hora sugeridas (a agenda atual). */
  defaultValues?: Partial<ServiceOrderPostponeValues>;
  /** Reagendamentos ainda permitidos; zero desliga o reagendamento. */
  remainingReschedules: number;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (values: ServiceOrderPostponeValues) => void;
}
