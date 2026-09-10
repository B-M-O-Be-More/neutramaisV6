"use client";

import FormLogin from "@/components/Forms/FormLogin";
import FormMfa from "@/components/Forms/FormMfa";
import { useLogin } from "@/hooks/useLogin";

export function Login() {
  const {
    step,
    formError,
    isSubmitting,
    captchaRequired,
    submitCredentials,
    submitMfa,
    backToCredentials,
  } = useLogin();

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
