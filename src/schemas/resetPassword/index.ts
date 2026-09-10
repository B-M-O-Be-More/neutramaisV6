import * as yup from "yup";

import { MIN_PASSWORD_LENGTH, passwordRule } from "@/schemas/password";

/* ---------------------------------------------------------------------------
 * US-03 — Redefinição de senha (efetivação com o token do e-mail)
 * As mensagens são CHAVES de tradução (ResetPassword.errors.*), traduzidas no
 * momento da exibição (t(message)).
 *
 * A política em si vive em schemas/password — fonte única compartilhada com o
 * cadastro, espelhando a identity-api (RN-528).
 * ------------------------------------------------------------------------- */

export { MIN_PASSWORD_LENGTH };

export const resetPasswordSchema = yup.object({
  password: passwordRule({
    required: "ResetPassword.errors.passwordRequired",
    tooShort: "ResetPassword.errors.passwordTooShort",
    uppercase: "ResetPassword.errors.passwordNeedsUppercase",
    digit: "ResetPassword.errors.passwordNeedsNumber",
    symbol: "ResetPassword.errors.passwordNeedsSymbol",
  }),
  passwordConfirmation: yup
    .string()
    .oneOf([yup.ref("password")], "ResetPassword.errors.passwordMismatch")
    .required("ResetPassword.errors.passwordConfirmationRequired"),
});
