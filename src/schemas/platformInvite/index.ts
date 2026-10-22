import * as yup from "yup";

import { passwordRule, type PasswordMessages } from "@/schemas/password";
import {
  PLATFORM_ROLES,
  type PlatformRole,
} from "@/services/platformInvites.service";

/* ---------------------------------------------------------------------------
 * Convite de operadores da plataforma — convite (admin) e aceite (público).
 * As mensagens são CHAVES de tradução (PlatformInvite.errors.*), traduzidas no
 * momento da exibição (t(message)).
 * ------------------------------------------------------------------------- */

export const platformInviteSchema = yup.object({
  email: yup
    .string()
    .trim()
    .required("PlatformInvite.errors.emailRequired")
    .email("PlatformInvite.errors.emailInvalid"),
  targetRole: yup
    .mixed<PlatformRole>()
    .oneOf([...PLATFORM_ROLES], "PlatformInvite.errors.roleRequired")
    .required("PlatformInvite.errors.roleRequired"),
});

export const ACCEPT_PASSWORD_MESSAGES: PasswordMessages & {
  lowercase: string;
} = {
  required: "PlatformInvite.errors.passwordRequired",
  tooShort: "PlatformInvite.errors.passwordTooShort",
  uppercase: "PlatformInvite.errors.passwordNeedsUppercase",
  digit: "PlatformInvite.errors.passwordNeedsNumber",
  symbol: "PlatformInvite.errors.passwordNeedsSymbol",
  lowercase: "PlatformInvite.errors.passwordNeedsLowercase",
};

// E.164: "+" seguido de 8 a 15 dígitos, o primeiro diferente de zero. A
// máscara do campo pode ter espaços, parênteses e hífens — validamos os
// dígitos.
const E164 = /^\+[1-9]\d{7,14}$/;

/**
 * Regras extras da senha no aceite de convite (guia NEU-563): além da
 * política comum, minúscula e um símbolo deste conjunto. O guia lista os
 * símbolos aceitos, então aqui a checagem é exata, e não "qualquer caractere
 * fora de letras e números".
 */
export const ACCEPT_PASSWORD_PATTERNS = {
  lowercase: /[a-z]/,
  symbol: /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/,
} as const;

/** Até 128 caracteres (limite do backend). */
export const MAX_ACCEPT_PASSWORD_LENGTH = 128;

/**
 * Aceite de convite — organização ou plataforma, mesma tela. O telefone é
 * pedido nos dois casos: é obrigatório no convite de plataforma, e a tela não
 * sabe de que tipo é o convite.
 */
export const acceptInviteSchema = yup.object({
  displayName: yup
    .string()
    .trim()
    .required("PlatformInvite.errors.nameRequired")
    .max(100, "PlatformInvite.errors.nameTooLong"),
  phone: yup
    .string()
    .required("PlatformInvite.errors.phoneRequired")
    .test("e164", "PlatformInvite.errors.phoneInvalid", (value) =>
      E164.test(`+${(value ?? "").replace(/\D/g, "")}`),
    ),
  password: passwordRule(ACCEPT_PASSWORD_MESSAGES)
    .max(MAX_ACCEPT_PASSWORD_LENGTH, "PlatformInvite.errors.passwordTooLong")
    .matches(
      ACCEPT_PASSWORD_PATTERNS.lowercase,
      ACCEPT_PASSWORD_MESSAGES.lowercase,
    )
    .matches(ACCEPT_PASSWORD_PATTERNS.symbol, ACCEPT_PASSWORD_MESSAGES.symbol),
  passwordConfirmation: yup
    .string()
    .oneOf([yup.ref("password")], "PlatformInvite.errors.passwordMismatch")
    .required("PlatformInvite.errors.passwordConfirmationRequired"),
});
