import { MFA_RATE_LIMIT_WINDOW_SECONDS, useMfaEnrollment } from "./hook";
import type {
  MfaEnrollmentFailure,
  MfaEnrollmentPhase,
  MfaEnrollmentSecrets,
  MfaEnrollmentSetupPhase,
  MfaEnrollmentStart,
  UseMfaEnrollmentOptions,
} from "./interface";

export { useMfaEnrollment, MFA_RATE_LIMIT_WINDOW_SECONDS };
export type {
  MfaEnrollmentFailure,
  MfaEnrollmentPhase,
  MfaEnrollmentSecrets,
  MfaEnrollmentSetupPhase,
  MfaEnrollmentStart,
  UseMfaEnrollmentOptions,
};
