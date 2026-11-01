import * as yup from "yup";

import { passwordRule } from "@/schemas/password";

/* ---------------------------------------------------------------------------
 * Meu Perfil (Figma 2205-18339 e 2206-20298). As mensagens são CHAVES de
 * tradução (Profile.errors.*), traduzidas na exibição (t(message)).
 * ------------------------------------------------------------------------- */

export const BIO_MAX_LENGTH = 300;

/** Dados pessoais editáveis (Figma 2943-27630). */
export const profilePersonalSchema = yup.object({
  displayName: yup
    .string()
    .trim()
    .required("Profile.errors.nameRequired")
    .min(3, "Profile.errors.nameTooShort")
    .max(120, "Profile.errors.tooLong")
    .default(""),
  phone: yup
    .string()
    .trim()
    .test(
      "phone",
      "Profile.errors.phoneInvalid",
      (value) => !value || /^\+?[\d\s()-]{10,20}$/.test(value),
    )
    .default(""),
  jobTitle: yup.string().trim().max(80, "Profile.errors.tooLong").default(""),
  bio: yup
    .string()
    .trim()
    .max(BIO_MAX_LENGTH, "Profile.errors.tooLong")
    .default(""),
});

export type ProfilePersonalValues = yup.InferType<typeof profilePersonalSchema>;

/** Alterar senha com a sessão aberta: mesma política do cadastro (RN-528). */
export const changePasswordSchema = yup.object({
  currentPassword: yup
    .string()
    .required("Profile.errors.currentPasswordRequired")
    .default(""),
  newPassword: passwordRule({
    required: "Profile.errors.newPasswordRequired",
    tooShort: "Profile.errors.passwordTooShort",
    uppercase: "Profile.errors.passwordUppercase",
    digit: "Profile.errors.passwordDigit",
    symbol: "Profile.errors.passwordSymbol",
  })
    .notOneOf([yup.ref("currentPassword")], "Profile.errors.passwordSame")
    .default(""),
  confirmPassword: yup
    .string()
    .required("Profile.errors.confirmRequired")
    .oneOf([yup.ref("newPassword")], "Profile.errors.confirmMismatch")
    .default(""),
});

export type ChangePasswordValues = yup.InferType<typeof changePasswordSchema>;

/** Código do autenticador (TOTP): exatamente 6 dígitos. */
export const totpCodeRule = yup
  .string()
  .trim()
  .required("Profile.errors.codeRequired")
  .matches(/^\d{6}$/, "Profile.errors.codeInvalid");
