"use client";

import { Button, Icon, Skeleton, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuChevronLeft, LuRefreshCw } from "react-icons/lu";

import FormOrderInvoice from "@/components/Forms/FormOrderInvoice";
import FormOrderTracking from "@/components/Forms/FormOrderTracking";
import OrderDetail from "@/components/OrderDetail";
import OrderShippingDialog from "@/components/OrderShippingDialog";
import { toaster } from "@/components/ui/toaster";
import { useSession } from "@/contexts/SessionContext";
import { currencyLocale } from "@/functions/currencyLocale";
import {
  invoiceValueMinor,
  minorToDecimalText,
  originPostalCode,
  sellerShippingActions,
} from "@/functions/orderShipping";
import { useOrderDetail } from "@/hooks/useOrderDetail";
import { useOrderInvoiceDownload } from "@/hooks/useOrderInvoiceDownload";
import { useOrganizationAddress } from "@/hooks/useOrganizationAddress";
import {
  useSellerShippingActions,
  type SellerShippingResult,
} from "@/hooks/useSellerShippingActions";

import { OrderDetailScreenProps } from "./interface";

type ShippingDialog = "invoice" | "tracking" | null;

/**
 * Detalhe do pedido com a leitura da orders-api: esqueleto enquanto carrega,
 * aviso de erro (com "Tentar de novo" quando cabe) e o download da NF. Na
 * visão do Seller, também as ações de envio do pedido físico: aceitar,
 * anexar a NF, imprimir as etiquetas e informar o rastreio.
 */
export function OrderDetailScreen({
  orderId,
  perspective,
  backHref,
  backLabel,
  contractsHref,
}: OrderDetailScreenProps) {
  const { t, i18n } = useTranslation();
  const { order, shipping, isLoading, errorKey, reload, setShipping } =
    useOrderDetail(orderId);
  const invoice = useOrderInvoiceDownload();
  const shippingActions = useSellerShippingActions({
    orderId,
    onShippingChange: setShipping,
  });
  const { profile } = useSession();
  const isSeller = perspective === "seller";
  const { address } = useOrganizationAddress(
    isSeller ? (profile?.organization.id ?? null) : null,
  );
  const [dialog, setDialog] = React.useState<ShippingDialog>(null);

  if (isLoading) {
    return (
      <Stack
        maxW="1280px"
        px={{ base: 4, md: "32px" }}
        py={{ base: 6, md: "28px" }}
        gap="24px"
        aria-busy="true"
      >
        <Skeleton h="24px" w="220px" rounded="8px" />
        <Skeleton h="56px" rounded="12px" />
        <Skeleton h="120px" rounded="14px" />
        <Skeleton h="320px" rounded="14px" />
      </Stack>
    );
  }

  if (!order) {
    const canRetry = errorKey === "OrderDetail.errors.failed";
    return (
      <Stack
        align="center"
        justify="center"
        gap="12px"
        py="96px"
        px={6}
        textAlign="center"
      >
        <Text role="alert" color="#0F1729" fontSize="14px" fontWeight={600}>
          {t(errorKey ?? "OrderDetail.errors.failed")}
        </Text>
        {canRetry ? (
          <Button
            variant="plain"
            h="36px"
            px="14px"
            gap="6px"
            rounded="10px"
            borderWidth="1px"
            borderColor="#E5E8EE"
            color="#1F5AFF"
            fontSize="13px"
            fontWeight={600}
            onClick={reload}
          >
            <Icon as={LuRefreshCw} boxSize="13px" />
            {t("OrderDetail.retry")}
          </Button>
        ) : (
          <Button
            asChild
            variant="plain"
            h="36px"
            px="14px"
            gap="6px"
            color="#5A6478"
            fontSize="13px"
            fontWeight={600}
          >
            <NextLink href={backHref}>
              <Icon as={LuChevronLeft} boxSize="14px" />
              {backLabel}
            </NextLink>
          </Button>
        )}
      </Stack>
    );
  }

  const handleDownloadInvoice = async () => {
    const error = await invoice.download(order.id);
    if (error) toaster.create({ type: "error", title: t(error) });
  };

  /** Aviso do resultado; em sucesso, fecha o modal aberto. */
  const notify = (result: SellerShippingResult, successKey: string) => {
    if (result.ok) {
      setDialog(null);
      if (successKey) toaster.create({ type: "success", title: t(successKey) });
      return;
    }
    toaster.create({
      type: "error",
      title: t(result.errorKey),
      description: result.detail,
    });
  };

  const number = `#${order.id.slice(0, 8).toUpperCase()}`;
  const dialogDescription = t("OrderShipping.dialogDescription", { number });
  const valueMinor = invoiceValueMinor(order);

  return (
    <>
      <OrderDetail
        order={order}
        shipping={shipping}
        perspective={perspective}
        locale={currencyLocale(i18n.language)}
        backHref={backHref}
        backLabel={backLabel}
        contractsHref={contractsHref}
        isDownloadingInvoice={invoice.isDownloading}
        onDownloadInvoice={handleDownloadInvoice}
        sellerShipping={
          isSeller
            ? {
                actions: sellerShippingActions(order, shipping),
                pending: shippingActions.pending,
                onAccept: async () =>
                  notify(
                    await shippingActions.accept(),
                    "OrderShipping.success.accepted",
                  ),
                onAttachInvoice: () => setDialog("invoice"),
                onInformTracking: () => setDialog("tracking"),
                onPrintLabel: async (labelId) =>
                  notify(await shippingActions.printLabel(labelId), ""),
              }
            : undefined
        }
      />

      {isSeller && (
        <>
          <OrderShippingDialog
            open={dialog === "invoice"}
            title={t("OrderShipping.invoice.title")}
            description={dialogDescription}
            isPending={shippingActions.pending === "invoice"}
            maxW="720px"
            onClose={() => setDialog(null)}
          >
            <FormOrderInvoice
              defaultValues={{
                value:
                  valueMinor !== null ? minorToDecimalText(valueMinor) : "",
                postalCode:
                  originPostalCode(order) ?? address?.postal_code ?? "",
                address: address?.street ?? "",
                complement: address?.complement ?? "",
                city: address?.city ?? "",
                stateAbbr: address?.state ?? "",
                senderEmail: profile?.email ?? "",
              }}
              isSubmitting={shippingActions.pending === "invoice"}
              onCancel={() => setDialog(null)}
              onSubmit={async (input) =>
                notify(
                  await shippingActions.attachInvoice(input),
                  "OrderShipping.success.invoiceAttached",
                )
              }
            />
          </OrderShippingDialog>

          <OrderShippingDialog
            open={dialog === "tracking"}
            title={t("OrderShipping.tracking.title")}
            description={dialogDescription}
            isPending={shippingActions.pending === "tracking"}
            onClose={() => setDialog(null)}
          >
            <FormOrderTracking
              defaultCode={shipping?.tracking ?? ""}
              isSubmitting={shippingActions.pending === "tracking"}
              onCancel={() => setDialog(null)}
              onSubmit={async ({ code }) =>
                notify(
                  await shippingActions.informTracking(code),
                  "OrderShipping.success.trackingInformed",
                )
              }
            />
          </OrderShippingDialog>
        </>
      )}
    </>
  );
}
