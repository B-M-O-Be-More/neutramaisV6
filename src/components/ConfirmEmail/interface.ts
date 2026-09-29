// O ConfirmEmail lê token/user_id da URL e não recebe props.
export type ConfirmEmailProps = Record<string, never>;

/**
 * `resuming` cobre o intervalo entre confirmar com sucesso e o redirect de volta
 * ao cadastro. Não há estado de sucesso final: o 200 sempre leva à etapa de
 * Verificação, onde a tela confirma o e-mail e oferece a validação do telefone.
 */
export type ConfirmEmailStatus = "loading" | "resuming" | "error";
