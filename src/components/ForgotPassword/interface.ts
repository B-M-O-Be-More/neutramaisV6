// O ForgotPassword é autocontido (a máquina de estados vive no
// useRequestPasswordReset) e não recebe props.
export type ForgotPasswordProps = Record<string, never>;

/** Linhas do card "detalhes do envio" no estado de sucesso. */
export const SUCCESS_DETAILS = [
  "validity",
  "attempts",
  "notReceived",
  "sender",
] as const;

/** Itens da lista "Possíveis causas" no estado de erro. */
export const ERROR_CAUSES = [
  "typo",
  "differentEmail",
  "disabled",
  "incomplete",
] as const;
