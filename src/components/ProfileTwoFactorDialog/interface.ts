export interface ProfileTwoFactorDialogProps {
  /** "enable": cadastrar o autenticador; "disable": desligar o 2FA. */
  mode: "enable" | "disable" | null;
  /** E-mail e telefone (mascarado) do usuário, nos métodos ainda indisponíveis. */
  email: string;
  phone: string | null;
  onClose: () => void;
  /** 2FA ligado ou desligado com sucesso. */
  onChanged: () => void;
}
