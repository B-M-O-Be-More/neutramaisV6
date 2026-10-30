export interface SellerOfferArchiveDialogProps {
  /** Nome da oferta a arquivar; null fecha o diálogo. */
  offeringName: string | null;
  isPending: boolean;
  onConfirm: () => void;
  onClose: () => void;
}
