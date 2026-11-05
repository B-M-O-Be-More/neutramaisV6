"use client";

import React from "react";
import { useTranslation } from "react-i18next";

import { toaster } from "@/components/ui/toaster";
import { useProfileSession } from "@/contexts/ProfileSessionContext";
import {
  contractSignAction,
  isSigningUrl,
  shortId,
} from "@/functions/contractFormat";
import { downloadBlob } from "@/functions/downloadBlob";
import { contractsService } from "@/services/contracts.service";
import {
  ConflictError,
  ForbiddenError,
  NetworkError,
  NotFoundError,
  ServerError,
  TimeoutError,
  upstreamDetailMessage,
} from "@/services/errors";
import type { OrderContract } from "@/types/contracts";

import type {
  ContractActionHandlers,
  UseContractActionsParams,
} from "./interface";

/** Chave i18n da falha do POST /sign, pelo `detail` fixo da contracts-api. */
function signErrorKey(error: unknown): string {
  const detail = upstreamDetailMessage(error);
  if (error instanceof ConflictError) {
    return detail === "Signer identity already bound"
      ? "Contracts.errors.signerBound"
      : "Contracts.errors.orderCancelled";
  }
  if (error instanceof ForbiddenError) {
    if (detail === "Active Identity profile with confirmed email required") {
      return "Contracts.errors.emailNotConfirmed";
    }
    return detail === "Required signer organization only"
      ? "Contracts.errors.notSigner"
      : "Contracts.errors.signForbidden";
  }
  if (error instanceof NotFoundError) return "Contracts.errors.notFound";
  if (
    error instanceof ServerError ||
    error instanceof NetworkError ||
    error instanceof TimeoutError
  ) {
    return "Contracts.errors.unavailable";
  }
  return "Contracts.errors.signFailed";
}

/**
 * Assinar e baixar o PDF, com o retorno ao usuário (toasts), iguais na lista
 * e no detalhe. Só o Buyer com `contract:sign` assina; o link sai em nova aba
 * e `onChanged` relê o contrato.
 */
export function useContractActions({ onChanged }: UseContractActionsParams) {
  const { t } = useTranslation();
  const { context } = useProfileSession();
  const userId = context?.user_id ?? null;
  const canSign = !!context?.permissions.includes("contract:sign");
  const [signingId, setSigningId] = React.useState<string | null>(null);
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null);

  const sign = async (contract: OrderContract) => {
    // A aba abre no clique: depois do await o navegador bloquearia o pop-up.
    const tab = window.open("", "_blank");
    setSigningId(contract.contractId);
    try {
      const result = await contractsService.sign(contract.contractId);
      const url = result.signingUrl;
      if (result.status === "signed") {
        tab?.close();
        toaster.create({
          type: "success",
          title: t("Contracts.toasts.alreadySigned"),
        });
      } else if (url && isSigningUrl(url)) {
        if (tab) {
          tab.opener = null;
          tab.location.href = url;
        } else {
          window.location.assign(url);
        }
        toaster.create({
          type: "info",
          title: t("Contracts.toasts.signingOpened"),
          description: t("Contracts.toasts.signingOpenedDescription"),
        });
      } else {
        tab?.close();
        toaster.create({
          type: "warning",
          title: t("Contracts.toasts.signingProcessing"),
          description: t("Contracts.toasts.signingProcessingDescription"),
        });
      }
    } catch (error) {
      tab?.close();
      toaster.create({ type: "error", title: t(signErrorKey(error)) });
    } finally {
      setSigningId(null);
      onChanged();
    }
  };

  const download = async (contract: OrderContract, loaded?: Blob | null) => {
    setDownloadingId(contract.contractId);
    try {
      const blob =
        loaded ??
        (await contractsService.downloadDocument(contract.contractId));
      downloadBlob(
        `contrato-pedido-${shortId(contract.orderId).toLowerCase()}.pdf`,
        blob,
      );
    } catch (error) {
      toaster.create({
        type: "error",
        title: t(
          error instanceof ConflictError
            ? "Contracts.errors.noDocument"
            : "Contracts.errors.documentFailed",
        ),
      });
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    contract: OrderContract,
    document?: Blob | null,
  ): ContractActionHandlers => ({
    signAction: contractSignAction(contract, { userId, canSign }),
    isSigning: signingId === contract.contractId,
    isDownloading: downloadingId === contract.contractId,
    canDownload: contract.documentHash !== null,
    onSign: () => sign(contract),
    onDownload: () => download(contract, document),
  });
}
