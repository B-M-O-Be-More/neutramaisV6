export interface LoginProps {
  /**
   * O que fazer quando a sessão nascer. Sem ele, o login segue para a área
   * autenticada; com ele (ex.: aceite de convite com conta existente), quem
   * usa o login decide.
   */
  onAuthenticated?: () => Promise<void> | void;
}
