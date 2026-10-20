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

export const acceptPlatformInviteSchema = yup.object({
  displayName: yup
    .string()
    .trim()
    .required("PlatformInvite.errors.nameRequired"),
  phone: yup
    .string()
    .required("PlatformInvite.errors.phoneRequired")
    .test("e164", "PlatformInvite.errors.phoneInvalid", (value) =>
      E164.test(`+${(value ?? "").replace(/\D/g, "")}`),
    ),
  password: passwordRule(ACCEPT_PASSWORD_MESSAGES),
  passwordConfirmation: yup
    .string()
    .oneOf([yup.ref("password")], "PlatformInvite.errors.passwordMismatch")
    .required("PlatformInvite.errors.passwordConfirmationRequired"),
});
