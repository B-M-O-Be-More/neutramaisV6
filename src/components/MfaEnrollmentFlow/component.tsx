"use client";

import FormMfaEnrollment from "@/components/Forms/FormMfaEnrollment";
import MfaEnrollmentIntro from "@/components/MfaEnrollmentIntro";
import MfaEnrollmentQrCode from "@/components/MfaEnrollmentQrCode";
import MfaEnrollmentStatus from "@/components/MfaEnrollmentStatus";
import MfaRecoveryCodes from "@/components/MfaRecoveryCodes";

import { MfaEnrollmentFlowProps } from "./interface";

/**
 * Telas do cadastro de MFA (intro → QR → códigos de recuperação → TOTP, ou a
 * falha), na fase em que o useMfaEnrollment estiver. Usado no primeiro login
 * (Login) e no aceite de convite de organização (AcceptInvite) — o contrato
 * de cada um fica no hook.
 */
export function MfaEnrollmentFlow({ enrollment }: MfaEnrollmentFlowProps) {
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
