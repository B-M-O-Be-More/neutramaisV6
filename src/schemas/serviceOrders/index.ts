import * as yup from "yup";

import { SERVICE_ORDER_RESCHEDULE_TYPES } from "@/types/serviceOrders";

/* ---------------------------------------------------------------------------
 * Ordens de serviço do seller. As mensagens são CHAVES de tradução
 * (ServiceOrders.errors.*), traduzidas na exibição (t(message)).
 * ------------------------------------------------------------------------- */

const REASON_MAX = 1000;
const SHORT_MAX = 120;

const requiredText = (max: number) =>
  yup
    .string()
    .trim()
    .required("ServiceOrders.errors.required")
    .max(max, "ServiceOrders.errors.tooLong")
    .default("");

/** Data local de hoje ("2026-10-31"), base do mínimo da nova data. */
export function todayInputValue(now = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** "Adiar atendimento" (Figma 2968-68398). */
export const serviceOrderPostponeSchema = yup.object({
  date: yup
    .string()
    .required("ServiceOrders.errors.required")
    .matches(/^\d{4}-\d{2}-\d{2}$/, "ServiceOrders.errors.dateInvalid")
    .test(
      "not-past",
      "ServiceOrders.errors.datePast",
      (value) => !value || value >= todayInputValue(),
    )
    .default(""),
  time: yup
    .string()
    .required("ServiceOrders.errors.required")
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/, "ServiceOrders.errors.timeInvalid")
    .default(""),
  reason: requiredText(REASON_MAX),
  reschedule: yup.boolean().default(false),
  // Com o reagendamento ligado, tipo e motivo são obrigatórios.
  rescheduleType: yup
    .string()
    .oneOf([...SERVICE_ORDER_RESCHEDULE_TYPES, ""])
    .when("reschedule", {
      is: true,
      then: (schema) => schema.required("ServiceOrders.errors.required"),
    })
    .default("internal"),
  rescheduleReason: yup
    .string()
    .trim()
    .max(REASON_MAX, "ServiceOrders.errors.tooLong")
    .when("reschedule", {
      is: true,
      then: (schema) => schema.required("ServiceOrders.errors.required"),
    })
    .default(""),
});

export type ServiceOrderPostponeValues = yup.InferType<
  typeof serviceOrderPostponeSchema
>;

/** "Cadastrar novo" técnico (Figma 2968-70259). */
export const serviceOrderTechnicianSchema = yup.object({
  name: requiredText(SHORT_MAX),
  email: yup
    .string()
    .trim()
    .email("ServiceOrders.errors.emailInvalid")
    .max(SHORT_MAX, "ServiceOrders.errors.tooLong")
    .default(""),
  phone: yup
    .string()
    .required("ServiceOrders.errors.required")
    .test(
      "phone",
      "ServiceOrders.errors.phoneInvalid",
      (value) => !value || /^\d{10,11}$/.test(value.replace(/\D/g, "")),
    )
    .default(""),
  specialty: requiredText(SHORT_MAX),
});

export type ServiceOrderTechnicianValues = yup.InferType<
  typeof serviceOrderTechnicianSchema
>;
