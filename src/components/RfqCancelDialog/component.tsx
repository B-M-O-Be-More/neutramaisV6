"use client";

import { Button, Icon } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuCircleX } from "react-icons/lu";

import ProposalsDialogFrame, {
  PROPOSALS_DIALOG_BUTTONS,
} from "@/components/ProposalsDialogFrame";
import ProposalsNotice from "@/components/ProposalsNotice";

import { RfqCancelDialogProps } from "./interface";

/**
 * Confirmação antes de cancelar RFQs: os sellers notificados deixam de poder
 * enviar propostas. Só vale enquanto nenhuma proposta virou pedido.
 */
export function RfqCancelDialog({
  rfqIds,
  isPending,
  onConfirm,
  onClose,
}: RfqCancelDialogProps) {
  const { t } = useTranslation();
  const count = rfqIds?.length ?? 0;

  return (
    <ProposalsDialogFrame
      role="alertdialog"
      open={rfqIds !== null}
      onClose={onClose}
      isBusy={isPending}
      maxW="480px"
      title={t("Proposals.rfq.cancel.title", { count })}
      footer={
        <>
          <Button
            {...PROPOSALS_DIALOG_BUTTONS.secondary}
            rounded="14px"
            color="#5A6478"
            disabled={isPending}
            onClick={onClose}
          >
            {t("Proposals.rfq.cancel.keep", { count })}
          </Button>
          <Button
            {...PROPOSALS_DIALOG_BUTTONS.danger}
            loading={isPending}
            onClick={onConfirm}
          >
            <Icon as={LuCircleX} boxSize="15px" />
            {t("Proposals.rfq.cancel.confirm", { count })}
          </Button>
        </>
      }
    >
      <ProposalsNotice tone="danger">
        {t("Proposals.rfq.cancel.description", {
          count,
          id: rfqIds?.[0] ?? "",
        })}
      </ProposalsNotice>
    </ProposalsDialogFrame>
  );
}
