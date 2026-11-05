"use client";

import { Button, Icon, Input, Skeleton, Stack, Text } from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuRefreshCw } from "react-icons/lu";

import BuyerOrderCard from "@/components/BuyerOrderCard";
import BuyerOrdersStats from "@/components/BuyerOrdersStats";
import {
  filterBuyerOrders,
  summarizeBuyerOrders,
} from "@/functions/buyerOrders";
import { useBuyerOrders } from "@/hooks/useBuyerOrders";

import { BuyerOrdersProps } from "./interface";

/**
 * "Meus Pedidos" do Buyer (NEU-550): indicadores, busca por produto, número
 * do pedido ou Seller, e a lista da orders-api, do mais novo ao mais antigo.
 * Cada pedido abre o detalhe em /orders/{id}.
 */
export function BuyerOrders({ locale }: BuyerOrdersProps) {
  const { t } = useTranslation();
  const { orders, isLoading, errorKey, reload } = useBuyerOrders();
  const [search, setSearch] = React.useState("");

  const summary = React.useMemo(() => summarizeBuyerOrders(orders), [orders]);
  const visible = React.useMemo(
    () => filterBuyerOrders(orders, search),
    [orders, search],
  );

  let content: React.ReactNode;
  if (isLoading) {
    content = (
      <Stack gap="12px" aria-busy="true">
        {[0, 1, 2].map((key) => (
          <Skeleton key={key} h="86px" rounded="14px" />
        ))}
      </Stack>
    );
  } else if (errorKey) {
    content = (
      <Stack align="center" gap="12px" py="48px" textAlign="center">
        <Text role="alert" color="#0F1729" fontSize="14px" fontWeight={600}>
          {t(errorKey)}
        </Text>
        {errorKey === "BuyerOrders.errors.failed" && (
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
            {t("BuyerOrders.retry")}
          </Button>
        )}
      </Stack>
    );
  } else if (visible.length === 0) {
    content = (
      <Text py="48px" textAlign="center" color="#8A9AB5" fontSize="14px">
        {t(
          orders.length === 0
            ? "BuyerOrders.empty"
            : "BuyerOrders.emptyFiltered",
        )}
      </Text>
    );
  } else {
    content = (
      <Stack as="ul" gap="12px" listStyleType="none" m={0} p={0}>
        {visible.map((order) => (
          <li key={order.id}>
            <BuyerOrderCard
              order={order}
              href={`/orders/${encodeURIComponent(order.id)}`}
              locale={locale}
            />
          </li>
        ))}
      </Stack>
    );
  }

  return (
    <Stack
      maxW="1280px"
      px={{ base: 4, md: "32px" }}
      py={{ base: 6, md: "28px" }}
      gap="24px"
    >
      <Stack gap="4px">
        <Text
          as="h1"
          color="#0F1729"
          fontSize="24px"
          fontWeight={800}
          lineHeight="36px"
        >
          {t("BuyerOrders.title")}
        </Text>
        <Text color="#8A9AB5" fontSize="14px" lineHeight="21px">
          {t("BuyerOrders.subtitle")}
        </Text>
      </Stack>

      {!errorKey && <BuyerOrdersStats data={summary} locale={locale} />}

      <Input
        id="buyer-orders-search"
        type="search"
        value={search}
        maxLength={255}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={t("BuyerOrders.searchPlaceholder")}
        aria-label={t("BuyerOrders.search")}
        h="42px"
        px="17px"
        bg="white"
        borderWidth="1px"
        borderColor="#E5E8EE"
        rounded="14px"
        fontSize="13px"
        color="#0F1729"
        _placeholder={{ color: "rgba(10,10,10,0.5)" }}
        disabled={isLoading || !!errorKey}
      />

      {content}
    </Stack>
  );
}
