"use client";

import FormLogin from "@/components/Forms/FormLogin";
import FormMfa from "@/components/Forms/FormMfa";
import MfaEnrollmentFlow from "@/components/MfaEnrollmentFlow";
import { useLogin } from "@/hooks/useLogin";

import { LoginProps } from "./interface";

export function Login({ onAuthenticated }: LoginProps) {
  const {
    step,
    formError,
    isSubmitting,
    captchaRequired,
    submitCredentials,
    submitMfa,
    backToCredentials,
    enrollment,
  } = useLogin({ onAuthenticated });

  // Cadastro de MFA obrigatório do primeiro login (NEU-479).
  if (step === "mfaEnrollment") {
    return <MfaEnrollmentFlow enrollment={enrollment} />;
  }

  if (step === "mfa") {
    return (
      <FormMfa
        onSubmit={submitMfa}
        onBack={backToCredentials}
        formError={formError}
        isSubmitting={isSubmitting}
      />
    );
  }

  return (
    <FormLogin
      onSubmit={submitCredentials}
      formError={formError}
      isSubmitting={isSubmitting}
      captchaRequired={captchaRequired}
    />
  );
}
