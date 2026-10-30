"use client";

import { Button, Icon, Stack } from "@chakra-ui/react";
import React from "react";
import { Trans, useTranslation } from "react-i18next";
import { LuSend } from "react-icons/lu";

import FormProposalRevision, {
  type ProposalRevisionValues,
} from "@/components/Forms/FormProposalRevision";
import ProposalsDialogFrame, {
  PROPOSALS_DIALOG_BUTTONS,
} from "@/components/ProposalsDialogFrame";
import ProposalsNotice from "@/components/ProposalsNotice";
import ProposalsTermsTable, {
  type ProposalsTermsRow,
} from "@/components/ProposalsTermsTable";
import { parseDecimal } from "@/functions/parseDecimal";
import {
  formatProposalMoney,
  moneyInputValue,
} from "@/functions/proposalFormat";
import type { DirectProposal } from "@/types/proposals";

import { DirectProposalReviseDialogProps } from "./interface";

function initialValues(proposal: DirectProposal): ProposalRevisionValues {
  return {
    price: moneyInputValue(proposal.price.amount),
    sla: proposal.sla,
    deliveryBusinessDays: proposal.deliveryBusinessDays,
    cancellationPolicy: proposal.cancellationPolicy,
    notes: proposal.notes ?? "",
  };
}

/**
 * Revisão de uma proposta direta em duas etapas (Figma 2063-32209 e
 * 2063-32291): novas condições e confirmação. A revisão vira a próxima versão
 * e o seller é notificado.
 */
export function DirectProposalReviseDialog({
  proposal,
  locale,
  isPending,
  onClose,
  onSubmit,
}: DirectProposalReviseDialogProps) {
  const { t } = useTranslation();
  // Rascunho validado; com ele, o modal está na confirmação.
  const [draft, setDraft] = React.useState<ProposalRevisionValues | null>(null);
  const [isEditing, setEditing] = React.useState(true);

  const nextVersion = (proposal?.version ?? 0) + 1;
  const isConfirming = !isEditing && draft !== null;

  const handleConfirm = async () => {
    if (!draft) return;
    const ok = await onSubmit({
      price: parseDecimal(draft.price) ?? 0,
      sla: draft.sla,
      deliveryBusinessDays: draft.deliveryBusinessDays,
      cancellationPolicy: draft.cancellationPolicy,
      notes: draft.notes,
    });
    if (ok) onClose();
  };

  const rows: ProposalsTermsRow[] =
    proposal && draft
      ? [
          {
            key: "price",
            label: t("Proposals.direct.revise.confirmPrice"),
            value: t("Proposals.direct.details.priceValue", {
              amount: formatProposalMoney(
                {
                  amount: parseDecimal(draft.price) ?? 0,
                  currency: proposal.price.currency,
                },
                locale,
              ),
              currency: proposal.price.currency,
            }),
          },
          {
            key: "sla",
            label: t("Proposals.direct.revise.confirmSla"),
            value: draft.sla,
          },
          {
            key: "delivery",
            label: t("Proposals.direct.details.delivery"),
            value: t("Proposals.direct.businessDays", {
              count: draft.deliveryBusinessDays,
            }),
          },
          ...(draft.cancellationPolicy
            ? [
                {
                  key: "cancellation",
                  label: t("Proposals.direct.details.cancellation"),
                  value: draft.cancellationPolicy,
                },
              ]
            : []),
          ...(draft.notes
            ? [
                {
                  key: "notes",
                  label: t("Proposals.direct.details.notes"),
                  value: draft.notes,
                },
              ]
            : []),
        ]
      : [];

  return (
    <ProposalsDialogFrame
      open={proposal !== null}
      onClose={onClose}
      isBusy={isPending}
      title={t(
        isConfirming
          ? "Proposals.direct.revise.confirmTitle"
          : "Proposals.direct.revise.title",
      )}
      footer={
        isConfirming ? (
          <>
            <Button
              {...PROPOSALS_DIALOG_BUTTONS.secondary}
              disabled={isPending}
              onClick={() => setEditing(true)}
            >
              {t("Proposals.dialog.back")}
            </Button>
            <Button
              {...PROPOSALS_DIALOG_BUTTONS.primary}
              loading={isPending}
              onClick={handleConfirm}
            >
              {t("Proposals.direct.revise.confirm")}
              <Icon as={LuSend} boxSize="14px" />
            </Button>
          </>
        ) : undefined
      }
    >
      {proposal && !isConfirming && (
        <FormProposalRevision
          currency={proposal.price.currency}
          nextVersion={nextVersion}
          defaultValues={draft ?? initialValues(proposal)}
          onBack={onClose}
          onSubmit={(values) => {
            setDraft(values);
            setEditing(false);
          }}
        />
      )}

      {proposal && isConfirming && (
        <Stack gap="20px">
          <ProposalsNotice tone="warning">
            <Trans
              i18nKey="Proposals.direct.revise.confirmNotice"
              values={{ version: nextVersion }}
              components={{ b: <strong /> }}
            />
          </ProposalsNotice>
          <ProposalsTermsTable
            title={t("Proposals.direct.revise.confirmHeading", {
              product: proposal.productName,
              seller: proposal.seller.name,
            })}
            rows={rows}
            footerTone="accent"
            footer={t("Proposals.direct.revise.versionChange", {
              from: proposal.version,
              to: nextVersion,
            })}
          />
        </Stack>
      )}
    </ProposalsDialogFrame>
  );
}
