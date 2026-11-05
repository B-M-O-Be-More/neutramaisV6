"use client";

import { Button, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import { useParams } from "next/navigation";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuCalendarClock, LuChevronDown, LuClock } from "react-icons/lu";

import AuthenticatedLayout from "@/components/Layouts/Authenticated";
import ServiceOrderItemCard from "@/components/ServiceOrderItemCard";
import ServiceOrderPostponeDialog from "@/components/ServiceOrderPostponeDialog";
import ServiceOrdersBreadcrumb from "@/components/ServiceOrdersBreadcrumb";
import ServiceOrdersToolbar from "@/components/ServiceOrdersToolbar";
import ServiceOrderStats from "@/components/ServiceOrderStats";
import ServiceOrderSummaryCard from "@/components/ServiceOrderSummaryCard";
import { toaster } from "@/components/ui/toaster";
import { useSellerServiceOrders } from "@/contexts/SellerServiceOrdersContext";
import {
  SERVICE_ORDER_ITEM_SUMMARY_STYLES,
  type ServiceOrderItemDisplayStatus,
} from "@/data/serviceOrderStatus";
import { currencyLocale } from "@/functions/currencyLocale";
import {
  formatProposalMoney,
  formatShortDate,
  hoursUntil,
} from "@/functions/proposalFormat";
import {
  daysUntil,
  matchesServiceOrderSearch,
  serviceOrderItemDisplayStatus,
  summarizeServiceOrderItems,
} from "@/functions/serviceOrders";
import type {
  ServiceOrderItem,
  ServiceOrderPostponement,
} from "@/types/serviceOrders";

type ItemFilter = ServiceOrderItemDisplayStatus | "all";

const FILTERS: ServiceOrderItemDisplayStatus[] = [
  "inProgress",
  "pending",
  "held",
  "postponed",
  "completed",
  "cancelled",
];

const LIST_ROOT = "/seller/service-orders";

function ServiceOrderItemsContent({ orderId }: { orderId: string }) {
  const { t, i18n } = useTranslation();
  const locale = currencyLocale(i18n.language);
  const { orders, now, pendingId, postpone } = useSellerServiceOrders();
  const order = orders.find((entry) => entry.orderId === orderId);
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<ItemFilter>("all");
  const [expanded, setExpanded] = React.useState<string[]>([]);
  const [postponingId, setPostponingId] = React.useState<string | null>(null);

  const breadcrumb = [
    { label: t("ServiceOrders.title"), href: LIST_ROOT },
    { label: orderId },
  ];

  if (!order) {
    return (
      <Stack
        maxW="1280px"
        px={{ base: 4, md: "32px" }}
        py={{ base: 6, md: "28px" }}
        gap="16px"
      >
        <ServiceOrdersBreadcrumb items={breadcrumb} />
        <Text color="#0F1729" fontSize="15px" fontWeight={700}>
          {t("ServiceOrders.notFound")}
        </Text>
      </Stack>
    );
  }

  const items = order.items;
  const postponing = items.find((item) => item.id === postponingId) ?? null;
  const visible = items.filter(
    (item) =>
      (filter === "all" || serviceOrderItemDisplayStatus(item) === filter) &&
      matchesServiceOrderSearch(
        [item.productName, item.id, item.address, item.technician?.name],
        search,
      ),
  );

  const options = [
    {
      value: "all" as ItemFilter,
      label: t("ServiceOrders.filterAll"),
      count: items.length,
    },
    ...FILTERS.map((status) => ({
      value: status as ItemFilter,
      label: t(`ServiceOrders.item.summaryStatus.${status}`),
      count: items.filter(
        (item) => serviceOrderItemDisplayStatus(item) === status,
      ).length,
    })).filter((option) => option.count > 0 || option.value === filter),
  ];

  const toggle = (id: string) =>
    setExpanded((current) =>
      current.includes(id)
        ? current.filter((entry) => entry !== id)
        : [...current, id],
    );

  const handlePostpone = async (
    itemId: string,
    postponement: ServiceOrderPostponement,
  ) => {
    const updated = await postpone(itemId, postponement);
    toaster.create(
      updated
        ? { type: "success", title: t("ServiceOrders.toasts.postponed") }
        : { type: "error", title: t("ServiceOrders.toasts.actionFailed") },
    );
    return !!updated;
  };

  const summaryProps = (item: ServiceOrderItem) => {
    const status = serviceOrderItemDisplayStatus(item);
    const slaHours = hoursUntil(item.slaDeadline, now);
    const date = (iso?: string) => (iso ? formatShortDate(iso, locale) : "");
    return {
      statusLabel: t(`ServiceOrders.item.summaryStatus.${status}`),
      statusStyle: SERVICE_ORDER_ITEM_SUMMARY_STYLES[status],
      alert:
        status === "postponed"
          ? {
              icon: LuCalendarClock,
              text: t("ServiceOrders.item.postponedTo", {
                date: date(item.postponedTo),
              }),
            }
          : status === "pending" || status === "held"
            ? {
                icon: LuClock,
                strong: true,
                text: t("ServiceOrders.item.slaLeft", { count: slaHours }),
              }
            : undefined,
      caption: t(
        status === "pending" && item.technician
          ? "ServiceOrders.item.caption.pendingWithTechnician"
          : `ServiceOrders.item.caption.${status}`,
        {
          date: date(item.completedAt ?? item.postponedTo),
          count: daysUntil(item.postponedTo ?? "", now),
          name: item.technician?.name,
        },
      ),
      captionAccent:
        status === "pending" || status === "held" || status === "postponed",
    };
  };

  return (
    <Stack
      maxW="1280px"
      px={{ base: 4, md: "32px" }}
      py={{ base: 6, md: "28px" }}
      gap="24px"
    >
      <ServiceOrdersBreadcrumb items={breadcrumb} />

      <Stack gap="4px">
        <Text
          as="h1"
          color="#0F1729"
          fontSize="24px"
          fontWeight={800}
          lineHeight="36px"
        >
          {t("ServiceOrders.items.title")}
        </Text>
        <Text color="#8A9AB5" fontSize="14px" lineHeight="21px">
          {t("ServiceOrders.items.subtitle", { id: order.orderId })}
        </Text>
      </Stack>

      <ServiceOrderStats
        data={summarizeServiceOrderItems(items)}
        scope="items"
        locale={locale}
      />

      <ServiceOrdersToolbar
        search={search}
        onSearchChange={setSearch}
        filterLabel={t("ServiceOrders.items.filterLabel")}
        options={options}
        status={filter}
        onStatusChange={setFilter}
      />

      {visible.length === 0 ? (
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
            {t(
              items.length === 0
                ? "ServiceOrders.items.empty"
                : "ServiceOrders.emptyFiltered",
            )}
          </Text>
        </Flex>
      ) : (
        <Stack gap="12px">
          {visible.map((item) => {
            const detailsHref = `${LIST_ROOT}/${encodeURIComponent(order.orderId)}/${encodeURIComponent(item.id)}`;
            return expanded.includes(item.id) ? (
              <ServiceOrderItemCard
                key={item.id}
                item={item}
                order={order}
                locale={locale}
                now={now}
                detailsHref={detailsHref}
                onCollapse={() => toggle(item.id)}
                onReschedule={() => setPostponingId(item.id)}
                onOpenDispute={() =>
                  toaster.create({
                    type: "info",
                    title: t("ServiceOrders.toasts.comingSoon"),
                  })
                }
              />
            ) : (
              <ServiceOrderSummaryCard
                key={item.id}
                title={item.productName}
                meta={t("ServiceOrders.item.summaryMeta", {
                  buyer: order.buyerName,
                  id: item.id,
                  date: formatShortDate(item.updatedAt, locale),
                })}
                amount={formatProposalMoney(item.amount, locale)}
                detailsHref={detailsHref}
                actions={
                  <Button
                    variant="plain"
                    h="34px"
                    px="12px"
                    gap="6px"
                    borderWidth="1px"
                    borderColor="#E5E8EE"
                    rounded="10px"
                    color="#5A6478"
                    fontSize="12px"
                    fontWeight={500}
                    aria-expanded={false}
                    _hover={{ bg: "#F4F6F9" }}
                    onClick={() => toggle(item.id)}
                  >
                    {t("ServiceOrders.item.expand")}
                    <Icon as={LuChevronDown} boxSize="13px" />
                  </Button>
                }
                {...summaryProps(item)}
              />
            );
          })}
        </Stack>
      )}

      <ServiceOrderPostponeDialog
        key={postponingId ?? "none"}
        item={postponing}
        isPending={!!postponing && pendingId === postponing.id}
        onClose={() => setPostponingId(null)}
        onConfirm={handlePostpone}
      />
    </Stack>
  );
}

// Demandas de uma ordem de serviço (Figma 3108-94102): cada OS em card
// resumido, que abre no "Ver OS" (Figma 2191-27226 e variações).
export default function ServiceOrderItemsPage() {
  const { orderId } = useParams<{ orderId: string }>();

  return (
    <AuthenticatedLayout>
      <ServiceOrderItemsContent orderId={decodeURIComponent(orderId)} />
    </AuthenticatedLayout>
  );
}
