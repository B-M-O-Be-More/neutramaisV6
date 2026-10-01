"use client";

import FormLogin from "@/components/Forms/FormLogin";
import FormMfa from "@/components/Forms/FormMfa";
import FormMfaEnrollment from "@/components/Forms/FormMfaEnrollment";
import MfaEnrollmentIntro from "@/components/MfaEnrollmentIntro";
import MfaEnrollmentQrCode from "@/components/MfaEnrollmentQrCode";
import MfaEnrollmentStatus from "@/components/MfaEnrollmentStatus";
import MfaRecoveryCodes from "@/components/MfaRecoveryCodes";
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
    enrollment,
  } = useLogin();

  // Cadastro de MFA obrigatório do primeiro login (NEU-479).
  if (step === "mfaEnrollment") {
    const { phase, secrets } = enrollment;

    if (phase === "failed" && enrollment.failure) {
      return (
        <MfaEnrollmentStatus
          failure={enrollment.failure}
          retryInSeconds={enrollment.retryInSeconds}
          onBackToLogin={enrollment.backToLogin}
        />
      );
    }

    if (phase === "qrCode" && secrets) {
      return (
        <MfaEnrollmentQrCode
          otpauthUri={secrets.otpauthUri}
          manualKey={secrets.manualKey}
          onNext={() => enrollment.goTo("recoveryCodes")}
          onBack={enrollment.backToLogin}
        />
      );
    }

    if (phase === "recoveryCodes" && secrets) {
      return (
        <MfaRecoveryCodes
          codes={secrets.recoveryCodes}
          saved={enrollment.recoveryCodesSaved}
          onSavedChange={enrollment.setRecoveryCodesSaved}
          onNext={() => enrollment.goTo("totp")}
          onBack={() => enrollment.goTo("qrCode")}
        />
      );
    }

    if (phase === "totp" && secrets) {
      return (
        <FormMfaEnrollment
          onSubmit={enrollment.confirm}
          onBack={() => enrollment.goTo("recoveryCodes")}
          formError={enrollment.formError}
          isSubmitting={enrollment.isSubmitting}
        />
      );
    }

    return (
      <MfaEnrollmentIntro
        onStart={enrollment.startSetup}
        onBack={enrollment.backToLogin}
        isSubmitting={enrollment.isSubmitting}
      />
    );
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
