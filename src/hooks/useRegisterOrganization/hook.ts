"use client";

import { useRouter } from "next/navigation";
import type { FieldValues, Path } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { toaster } from "@/components/ui/toaster";
import { toE164 } from "@/functions/toE164";
import {
  ConflictError,
  RateLimitError,
  ValidationError,
  upstreamPasswordViolations,
} from "@/services/errors";
import { REGISTER_PASSWORD_MESSAGES } from "@/schemas/register";
import { violationMessage } from "@/schemas/password";
import {
  organizationsService,
  type OrganizationType,
} from "@/services/organizations.service";

import type {
  RegisterFormValues,
  UseRegisterOrganizationOptions,
} from "./interface";

// Mapeia os nomes de campo da identity-api para os campos do formulário,
// para que erros de validação (422) apareçam inline no input correto.
const FIELD_MAP: Record<string, string> = {
  tax_id: "document",
  contact_email: "email",
  email: "email",
  contact_phone: "phone",
  phone: "phone",
  country_code: "country",
  legal_name: "companyName",
  password: "password",
  display_name: "responsibleName",
};

/**
 * Orquestra o cadastro (US-02): uma única chamada a
 * `POST /organizations/register`, que cria a organização E a credencial do
 * usuário-raiz (daí o `password` no payload), e redireciona para a confirmação.
 * Erros são tratados aqui (toast genérico + erros de campo via setError); o
 * componente só dispara `submit` e reage ao retorno booleano.
 *
 * Observação: setor, endereço e `responsibleName` coletados no formulário NÃO
 * são enviados — o register não os aceita (recusa campo desconhecido com
 * `extra_forbidden`). Ficam reservados para o KYC / atualização pós-login.
 */
export function useRegisterOrganization<
  T extends RegisterFormValues & FieldValues,
>(
  organizationType: OrganizationType,
  { setError }: UseRegisterOrganizationOptions<T>,
) {
  const router = useRouter();
  const { t } = useTranslation();

  function applyFieldErrors(fields: Record<string, string[]>): boolean {
    let mapped = false;
    for (const [apiField, messages] of Object.entries(fields)) {
      const formField = FIELD_MAP[apiField];
      if (formField && messages[0]) {
        setError(formField as Path<T>, { message: messages[0] });
        mapped = true;
      }
    }
    return mapped;
  }

  function handleError(error: unknown): void {
    // Política de senha: o upstream devolve as violações em
    // `metadata.detail.violations`, fora do envelope de erros e nem sempre como
    // 422 — por isso é checado antes dos erros por status.
    const violations = upstreamPasswordViolations(error);
    if (violations) {
      const message = violations
        .map((violation) =>
          violationMessage(violation, REGISTER_PASSWORD_MESSAGES),
        )
        .find(Boolean);

      setError("password" as Path<T>, {
        message: message ?? "Register.errors.passwordPolicy",
      });
      return;
    }

    if (error instanceof ValidationError) {
      const mapped = applyFieldErrors(error.fields);
      if (!mapped) {
        toaster.create({
          type: "error",
          title: t("Register.feedback.error"),
          description: error.errors[0]?.detail ?? error.message,
        });
      }
      return;
    }

    if (error instanceof ConflictError) {
      // Organização já cadastrada — aponta para o documento.
      setError("document" as Path<T>, {
        message: "Register.errors.documentTaken",
      });
      return;
    }

    if (error instanceof RateLimitError) {
      toaster.create({
        type: "error",
        title: t("Register.feedback.rateLimit"),
      });
      return;
    }

    toaster.create({
      type: "error",
      title: t("Register.feedback.error"),
      description: error instanceof Error ? error.message : undefined,
    });
  }

  async function submit(values: T): Promise<boolean> {
    const taxId = (values.document ?? "").replace(/\D/g, "");
    const phone = toE164(values.phone);

    try {
      // `password` é obrigatório aqui: o register cria a organização e a
      // credencial do usuário-raiz numa única chamada. Ver nota no service —
      // o artefato e o Insomnia omitem o campo, mas a API o exige.
      const organization = await organizationsService.register({
        organization_type: organizationType,
        country_code: values.country,
        tax_id: taxId,
        legal_name: values.companyName,
        contact_email: values.email,
        contact_phone: phone,
        password: values.password,
      });

      // NÃO chamamos mais `POST /organizations/{id}/users` aqui: esse endpoint
      // exige Bearer ("Bearer token required") e no cadastro público ainda não
      // existe sessão. Ele serve para um admin autenticado adicionar membros —
      // o usuário-raiz já nasce do `register` acima.
      //
      // TODO: `responsibleName` deixou de ser enviado (o register recusa
      // `display_name` com `extra_forbidden`). Definir com o backend onde o nome
      // do responsável entra — provavelmente num PATCH do usuário após o login.

      // Próxima etapa: confirmação de e-mail + telefone.
      // TODO: a rota `/register/confirm` não existe (a que existe é
      // `/register/confirm-email`, que é a landing do link do e-mail e espera
      // token + user_id). Falta uma tela de "confira sua caixa de entrada".
      const query = new URLSearchParams({
        org: organization.id,
        email: values.email,
      });
      router.push(`/register/confirm?${query.toString()}`);
      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  }

  return { submit };
}
