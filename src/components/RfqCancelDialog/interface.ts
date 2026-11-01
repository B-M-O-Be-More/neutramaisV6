export interface RfqCancelDialogProps {
  /** IDs das RFQs a cancelar (uma ou várias, em lote); null fecha. */
  rfqIds: string[] | null;
  isPending: boolean;
  onConfirm: () => void;
  onClose: () => void;
}
