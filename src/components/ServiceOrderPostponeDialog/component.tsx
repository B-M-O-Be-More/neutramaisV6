"use client";

import { useTranslation } from "react-i18next";

import FormServiceOrderPostpone from "@/components/Forms/FormServiceOrderPostpone";
import ProposalsDialogFrame from "@/components/ProposalsDialogFrame";
import { remainingReschedules } from "@/functions/serviceOrders";
import type { ServiceOrderPostponeValues } from "@/schemas/serviceOrders";
import type { ServiceOrderRescheduleType } from "@/types/serviceOrders";

import { ServiceOrderPostponeDialogProps } from "./interface";

/** ISO → data e hora locais dos campos ("2026-07-10", "09:00"). */
function localParts(iso?: string): { date: string; time: string } {
  const date = iso ? new Date(iso) : null;
  if (!date || Number.isNaN(date.getTime())) return { date: "", time: "" };
  const pad = (value: number) => String(value).padStart(2, "0");
  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  };
}

/**
 * "Adiar ordem de serviço" (Figma 2968-68398): nova previsão de atendimento
 * da demanda, com reagendamento formal opcional.
 */
export function ServiceOrderPostponeDialog({
  item,
  isPending,
  onClose,
  onConfirm,
}: ServiceOrderPostponeDialogProps) {
  const { t } = useTranslation();

  const handleSubmit = async (values: ServiceOrderPostponeValues) => {
    if (!item) return;
    const ok = await onConfirm(item.id, {
      scheduledAt: `${values.date}T${values.time}`,
      reason: values.reason,
      reschedule: values.reschedule,
      ...(values.reschedule
        ? {
            rescheduleType: values.rescheduleType as ServiceOrderRescheduleType,
            rescheduleReason: values.rescheduleReason,
          }
        : {}),
    });
    if (ok) onClose();
  };

  return (
    <ProposalsDialogFrame
      open={item !== null}
      onClose={onClose}
      isBusy={isPending}
      closeTone="filled"
      maxW="513px"
      title={t("ServiceOrders.postpone.title")}
      subtitle={t("ServiceOrders.postpone.subtitle")}
    >
      {item && (
        <FormServiceOrderPostpone
          defaultValues={localParts(item.scheduledAt)}
          remainingReschedules={remainingReschedules(item)}
          isSubmitting={isPending}
          onCancel={onClose}
          onSubmit={handleSubmit}
        />
      )}
    </ProposalsDialogFrame>
  );
}
