"use client";

import { useTranslation } from "react-i18next";

import { toaster } from "@/components/ui/toaster";
import type { Contract } from "@/types/contracts";

import type {
  ContractActionHandlers,
  UseContractActionsParams,
} from "./interface";

/**
 * Ações de um contrato com o retorno ao usuário (toasts), iguais na lista e
 * no detalhe. Recebe as ações cruas do useContracts.
 */
export function useContractActions({
  pendingId,
  toggleAutoRenew,
  requestAmendment,
  requestCancellation,
}: UseContractActionsParams) {
  const { t } = useTranslation();

  return (contract: Contract): ContractActionHandlers => ({
    isPending: pendingId === contract.id,
    onToggleAutoRenew: async () => {
      if (!(await toggleAutoRenew(contract.id))) return;
      toaster.create({
        type: "success",
        title: t(
          contract.autoRenew
            ? "Contracts.toasts.autoRenewOff"
            : "Contracts.toasts.autoRenewOn",
        ),
      });
    },
    onSubmitAmendment: async (description: string) => {
      const request = await requestAmendment(contract.id, description);
      toaster.create(
        request
          ? {
              type: "success",
              title: t("Contracts.toasts.amendmentSent"),
              description: t("Contracts.toasts.amendmentSentDescription", {
                id: request.id,
              }),
            }
          : { type: "error", title: t("Contracts.toasts.actionFailed") },
      );
      return !!request;
    },
    onConfirmCancellation: async () => {
      const ok = await requestCancellation(contract.id);
      toaster.create(
        ok
          ? {
              type: "success",
              title: t("Contracts.toasts.cancellationRequested"),
              description: t(
                "Contracts.toasts.cancellationRequestedDescription",
              ),
            }
          : { type: "error", title: t("Contracts.toasts.actionFailed") },
      );
      return ok;
    },
  });
}
