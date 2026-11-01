export interface ServiceOrderDialogActionsProps {
  confirmLabel: string;
  isSubmitting?: boolean;
  confirmDisabled?: boolean;
  onCancel: () => void;
  /** Sem `onConfirm`, a ação principal envia o formulário (type="submit"). */
  onConfirm?: () => void;
}
