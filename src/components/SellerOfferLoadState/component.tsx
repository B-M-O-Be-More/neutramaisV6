"use client";

import { Button, Icon, Link, Skeleton, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { useTranslation } from "react-i18next";
import { LuRefreshCw } from "react-icons/lu";

import { SellerOfferLoadStateProps } from "./interface";

/**
 * Estados de carregamento de uma oferta (detalhe e edição): esqueleto
 * enquanto carrega, aviso quando não existe e "tentar de novo" em erro.
 */
export function SellerOfferLoadState({
  status,
  onRetry,
}: SellerOfferLoadStateProps) {
  const { t } = useTranslation();

  if (status === "loading") {
    return (
      <Stack gap="16px" aria-busy="true">
        <Skeleton h="129px" rounded="21px" />
        <Skeleton h="72px" rounded="14px" />
        <Skeleton h="260px" rounded="14px" />
      </Stack>
    );
  }

  return (
    <Stack
      align="center"
      gap="12px"
      py="48px"
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="22px"
      textAlign="center"
    >
      <Text color="#0F1729" fontSize="15px" fontWeight={700}>
        {status === "notFound"
          ? t("SellerOfferDetail.notFound")
          : t("SellerOfferDetail.loadError")}
      </Text>
      {status === "error" ? (
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
          onClick={onRetry}
        >
          <Icon as={LuRefreshCw} boxSize="13px" />
          {t("SellerOffers.list.retry")}
        </Button>
      ) : (
        <Link asChild color="#1F5AFF" fontSize="13px" fontWeight={600}>
          <NextLink href="/seller/offers">{t("SellerOffers.title")}</NextLink>
        </Link>
      )}
    </Stack>
  );
}
