"use client";

import { Button, Icon, Skeleton, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { useTranslation } from "react-i18next";
import { LuChevronLeft, LuRefreshCw } from "react-icons/lu";

import OrderDetail from "@/components/OrderDetail";
import { toaster } from "@/components/ui/toaster";
import { currencyLocale } from "@/functions/currencyLocale";
import { useOrderDetail } from "@/hooks/useOrderDetail";
import { useOrderInvoiceDownload } from "@/hooks/useOrderInvoiceDownload";

import { OrderDetailScreenProps } from "./interface";

/**
 * Detalhe do pedido com a leitura da orders-api: esqueleto enquanto carrega,
 * aviso de erro (com "Tentar de novo" quando cabe) e o download da NF.
 */
export function OrderDetailScreen({
  orderId,
  perspective,
  backHref,
  backLabel,
  contractsHref,
}: OrderDetailScreenProps) {
  const { t, i18n } = useTranslation();
  const { order, shipping, isLoading, errorKey, reload } =
    useOrderDetail(orderId);
  const invoice = useOrderInvoiceDownload();

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

  return (
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
    />
  );
}
