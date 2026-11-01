import type {
  ServiceOrderItem,
  ServiceOrderTechnician,
  ServiceOrderTechnicianDraft,
} from "@/types/serviceOrders";

export interface ServiceOrderTechnicianDialogProps {
  /** Demanda que recebe o técnico; null fecha o modal. */
  item: ServiceOrderItem | null;
  /** Equipe própria do seller. */
  technicians: ServiceOrderTechnician[];
  isPending: boolean;
  onClose: () => void;
  /** Técnico escolhido (ID) ou cadastrado agora. */
  onConfirm: (technician: string | ServiceOrderTechnicianDraft) => void;
}
