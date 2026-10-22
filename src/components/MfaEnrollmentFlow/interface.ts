import type { UseMfaEnrollmentReturn } from "@/hooks/useMfaEnrollment";

export interface MfaEnrollmentFlowProps {
  /** Estado e ações do cadastro (useMfaEnrollment), vindos de quem o abriu. */
  enrollment: UseMfaEnrollmentReturn;
}
