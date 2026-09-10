export interface CaptchaProps {
  /**
   * Recebe o token do hCaptcha quando o usuário resolve o desafio, e `undefined`
   * quando o token expira ou o desafio é fechado com erro.
   */
  onVerify: (token?: string) => void;
  /** Mensagem exibida quando a site key não está configurada no ambiente. */
  unavailableLabel?: string;
}
