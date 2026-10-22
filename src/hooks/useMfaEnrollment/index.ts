import { MFA_RATE_LIMIT_WINDOW_SECONDS, useMfaEnrollment } from "./hook";
import type {
  MfaEnrollmentContract,
  MfaEnrollmentFailure,
  MfaEnrollmentPhase,
  MfaEnrollmentSecrets,
  MfaEnrollmentSetupPhase,
  MfaEnrollmentStart,
  UseMfaEnrollmentOptions,
} from "./interface";

/** Estado e ações do cadastro, como o hook devolve. */
type UseMfaEnrollmentReturn = ReturnType<typeof useMfaEnrollment>;

export { useMfaEnrollment, MFA_RATE_LIMIT_WINDOW_SECONDS };
export type {
  MfaEnrollmentContract,
  MfaEnrollmentFailure,
  MfaEnrollmentPhase,
  MfaEnrollmentSecrets,
  MfaEnrollmentSetupPhase,
  MfaEnrollmentStart,
  UseMfaEnrollmentOptions,
  UseMfaEnrollmentReturn,
};
