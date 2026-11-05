export interface MfaStepUpDialogProps {
  open: boolean;
  /** Por que o código é pedido (ex.: "Para alterar a conta de recebimento…"). */
  reason: string;
  /** A sessão já tem MFA: repita a ação que pediu o código. */
  onSuccess: () => void;
  onClose: () => void;
}
