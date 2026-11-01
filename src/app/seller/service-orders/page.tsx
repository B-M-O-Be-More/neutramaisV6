"use client";

import { Button, Flex, Stack, Text } from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuClock } from "react-icons/lu";

import AuthenticatedLayout from "@/components/Layouts/Authenticated";
import ServiceOrdersToolbar from "@/components/ServiceOrdersToolbar";
import ServiceOrderStats from "@/components/ServiceOrderStats";
import ServiceOrderSummaryCard from "@/components/ServiceOrderSummaryCard";
import { toaster } from "@/components/ui/toaster";
import { useSellerServiceOrders } from "@/contexts/SellerServiceOrdersContext";
import { SERVICE_ORDER_STATUS_STYLES } from "@/data/serviceOrderStatus";
import { currencyLocale } from "@/functions/currencyLocale";
import {
  formatProposalMoney,
  formatShortDate,
  hoursUntil,
} from "@/functions/proposalFormat";
import {
  daysSince,
  matchesServiceOrderSearch,
  serviceOrderDisplayStatus,
  summarizeServiceOrders,
} from "@/functions/serviceOrders";
import type { ServiceOrder } from "@/types/serviceOrders";

type OrderFilter = ReturnType<typeof serviceOrderDisplayStatus> | "all";

// Ordem das abas de status quando "Filtros" abre.
const FILTERS: Exclude<OrderFilter, "all">[] = [
  "inProgress",
  "pending",
  "held",
  "acknowledged",
  "completed",
  "rejected",
  "credited",
  "cancelled",
];

/** Lista vazia ou sem resultado para a busca/filtro. */
function EmptyList({ message }: { message: string }) {
  return (
    <Flex
      align="center"
      justify="center"
      minH="121px"
      px="24px"
      py="20px"
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="14px"
    >
      <Text color="#8A9AB5" fontSize="13px" lineHeight="19.5px">
        {message}
      </Text>
    </Flex>
  );
}

function SellerServiceOrdersContent() {
  const { t, i18n } = useTranslation();
  const locale = currencyLocale(i18n.language);
  const { orders, now } = useSellerServiceOrders();
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<OrderFilter>("all");

  const summary = summarizeServiceOrders(orders);
  const visible = orders.filter(
    (order) =>
      (filter === "all" || serviceOrderDisplayStatus(order) === filter) &&
      matchesServiceOrderSearch(
        [order.productName, order.buyerName, order.orderId],
        search,
      ),
  );

  const options = [
    {
      value: "all" as OrderFilter,
      label: t("ServiceOrders.filterAll"),
      count: orders.length,
    },
    ...FILTERS.map((status) => ({
      value: status as OrderFilter,
      label: t(`ServiceOrders.order.status.${status}`),
      count: orders.filter(
        (order) => serviceOrderDisplayStatus(order) === status,
      ).length,
    })).filter((option) => option.count > 0 || option.value === filter),
  ];

  const showComingSoon = () =>
    toaster.create({
      type: "info",
      title: t("ServiceOrders.toasts.comingSoon"),
    });

  const cardProps = (order: ServiceOrder) => {
    const status = serviceOrderDisplayStatus(order);
    const isWaiting = status === "pending" || status === "held";
    const responseHours = order.responseDeadline
      ? hoursUntil(order.responseDeadline, now)
      : 0;
    return {
      statusLabel: t(`ServiceOrders.order.status.${status}`),
      statusStyle: SERVICE_ORDER_STATUS_STYLES[status],
      alert:
        isWaiting && responseHours > 0
          ? {
              icon: LuClock,
              strong: true,
              text: t("ServiceOrders.order.responseLeft", {
                count: responseHours,
              }),
            }
          : undefined,
      caption: t(`ServiceOrders.order.caption.${status}`, {
        count: daysSince(order.createdAt, now),
      }),
      captionAccent: isWaiting,
      actions:
        status === "pending" ? (
          <Button
            variant="plain"
            h="34px"
            px="12px"
            borderWidth="1px"
            borderColor="#FECACA"
            rounded="10px"
            color="#EF4444"
            fontSize="12px"
            fontWeight={500}
            _hover={{ bg: "#FEF2F2" }}
            onClick={showComingSoon}
          >
            {t("ServiceOrders.order.cancel")}
          </Button>
        ) : status === "credited" ? (
          <Button
            variant="plain"
            h="34px"
            px="12px"
            bg="#F3EEFF"
            borderWidth="1px"
            borderColor="#D3BFFD"
            rounded="10px"
            color="#8B5CF6"
            fontSize="12px"
            fontWeight={600}
            _hover={{ bg: "#E9E0FF" }}
            onClick={showComingSoon}
          >
            {t("ServiceOrders.order.viewCredit")}
          </Button>
        ) : undefined,
    };
  };

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
          {t("ServiceOrders.title")}
        </Text>
        <Text color="#8A9AB5" fontSize="14px" lineHeight="21px">
          {t("ServiceOrders.subtitle")}
        </Text>
      </Stack>

      <ServiceOrderStats data={summary} scope="orders" locale={locale} />

      <ServiceOrdersToolbar
        search={search}
        onSearchChange={setSearch}
        filterLabel={t("ServiceOrders.filterLabel")}
        options={options}
        status={filter}
        onStatusChange={setFilter}
      />

      {visible.length === 0 ? (
        <EmptyList
          message={t(
            orders.length === 0
              ? "ServiceOrders.empty"
              : "ServiceOrders.emptyFiltered",
          )}
        />
      ) : (
        <Stack gap="12px">
          {visible.map((order) => (
            <ServiceOrderSummaryCard
              key={order.orderId}
              title={order.productName}
              meta={t("ServiceOrders.order.meta", {
                buyer: order.buyerName,
                id: order.orderId,
                date: formatShortDate(order.createdAt, locale),
              })}
              amount={formatProposalMoney(order.amount, locale)}
              detailsHref={`/seller/service-orders/${encodeURIComponent(order.orderId)}`}
              {...cardProps(order)}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
}

// Ordens de serviço do seller (Figma 2191-24614): uma por pedido recebido,
// com o status de execução; "Ver detalhes" abre as demandas da ordem.
export default function SellerServiceOrdersPage() {
  return (
    <AuthenticatedLayout>
      <SellerServiceOrdersContent />
    </AuthenticatedLayout>
  );
}
