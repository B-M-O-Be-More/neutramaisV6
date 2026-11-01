"use client";

import { Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

import FormProposalCancel from "@/components/Forms/FormProposalCancel";
import ProposalsDialogFrame from "@/components/ProposalsDialogFrame";
import ProposalsNotice from "@/components/ProposalsNotice";

import { DirectProposalCancelDialogProps } from "./interface";

/**
 * Cancelamento de uma proposta direta (Figma 2068-34938): o seller é
 * notificado; não afeta o score público, mas entra nas métricas comerciais.
 */
export function DirectProposalCancelDialog({
  proposal,
  isPending,
  onClose,
  onConfirm,
}: DirectProposalCancelDialogProps) {
  const { t } = useTranslation();

  return (
    <ProposalsDialogFrame
      role="alertdialog"
      open={proposal !== null}
      onClose={onClose}
      isBusy={isPending}
      title={t("Proposals.direct.cancel.title")}
    >
      {proposal && (
        <Stack gap="20px">
          <ProposalsNotice
            tone="danger"
            title={t("Proposals.direct.cancel.noticeTitle")}
          >
            {t("Proposals.direct.cancel.noticeDescription")}
          </ProposalsNotice>

          <Stack
            gap={0}
            px="17px"
            py="13px"
            bg="#F8F9FB"
            borderWidth="1px"
            borderColor="#E5E8EE"
            rounded="14px"
          >
            <Text
              color="#A0ABB8"
              fontSize="9px"
              fontWeight={700}
              lineHeight="13.5px"
              letterSpacing="0.45px"
              textTransform="uppercase"
            >
              {t("Proposals.direct.cancel.target")}
            </Text>
            <Text
              pt="4px"
              color="#0F1729"
              fontSize="14px"
              fontWeight={700}
              lineHeight="21px"
            >
              {proposal.productName}
            </Text>
            <Text color="#8A9AB5" fontSize="12px" lineHeight="18px">
              {t("Proposals.direct.cancel.targetMeta", {
                seller: proposal.seller.name,
                id: proposal.id,
                version: proposal.version,
              })}
            </Text>
          </Stack>

          <FormProposalCancel
            isSubmitting={isPending}
            onKeep={onClose}
            onSubmit={async (values) => {
              if (await onConfirm(values)) onClose();
            }}
          />
        </Stack>
      )}
    </ProposalsDialogFrame>
  );
}
