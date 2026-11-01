import type { ContractChangeRequest } from "@/types/contracts";

export interface ContractChangeRequestsProps {
  contractId: string;
  requests: ContractChangeRequest[];
  locale: string;
  /** O formulário também abre pelo "Solicitar aditivo" do card de ações. */
  isFormOpen: boolean;
  isSubmitting: boolean;
  onOpenForm: () => void;
  onCloseForm: () => void;
  onSubmit: (description: string) => void;
}
