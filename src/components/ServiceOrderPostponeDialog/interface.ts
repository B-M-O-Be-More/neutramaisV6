import type {
  ServiceOrderItem,
  ServiceOrderPostponement,
} from "@/types/serviceOrders";

export interface ServiceOrderPostponeDialogProps {
  /** Demanda a adiar; null fecha o modal. */
  item: ServiceOrderItem | null;
  isPending: boolean;
  onClose: () => void;
  /** Aplica o adiamento; `true` fecha o modal. */
  onConfirm: (
    itemId: string,
    postponement: ServiceOrderPostponement,
  ) => Promise<boolean>;
}
