"use client";

import { Button, Icon, Skeleton, Stack, Text } from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuRefreshCw } from "react-icons/lu";

import AuthenticatedLayout from "@/components/Layouts/Authenticated";
import ProposalsNotice from "@/components/ProposalsNotice";
import SellerInboxTabs, {
  type SellerInboxTab,
} from "@/components/SellerInboxTabs";
import SellerOrderCard from "@/components/SellerOrderCard";
import SellerOrderComplementDialog from "@/components/SellerOrderComplementDialog";
import SellerOrdersFilters, {
  type SellerOrdersFiltersValue,
} from "@/components/SellerOrdersFilters";
import SellerOrdersInfo from "@/components/SellerOrdersInfo";
import SellerOrdersStats from "@/components/SellerOrdersStats";
import SellerRfqCard from "@/components/SellerRfqCard";
import SellerRfqStats from "@/components/SellerRfqStats";
import { toaster } from "@/components/ui/toaster";
import { SellerSessionProvider } from "@/contexts/SellerSessionContext";
import { currencyLocale } from "@/functions/currencyLocale";
import {
  sellerOrderHasSpecification,
  sellerOrderNeedsShippingAccept,
  sellerOrderProductNames,
  sellerOrderStatus,
} from "@/functions/sellerOrderSummary";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useProductSpecifications } from "@/hooks/useProductSpecifications";
import { useSellerOrders } from "@/hooks/useSellerOrders";
import { useSellerRfqs } from "@/hooks/useSellerRfqs";
import { isCheckoutOrder, type ProductOrder } from "@/services/orders.service";
import type { SellerRfq, SellerRfqProposalDraft } from "@/types/sellerRfqs";

const TABS: SellerInboxTab[] = ["orders", "rfq"];

const INITIAL_FILTERS: SellerOrdersFiltersValue = {
  search: "",
  specificationId: "",
  status: "all",
};

/** Fila vazia, ou o erro da leitura (com "Tentar de novo" quando cabe). */
function QueueMessage({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Stack
      align="center"
      justify="center"
      gap="12px"
      minH="121px"
      px="24px"
      py="20px"
      bg="white"
      rounded="17px"
      textAlign="center"
    >
      <Text
        color="#0F1729"
        fontSize="15.8px"
        fontWeight={700}
        lineHeight="23.7px"
      >
        {message}
      </Text>
      {onRetry && (
        <Button
          variant="plain"
          h="36px"
          px="14px"
          gap="6px"
          rounded="10px"
          borderWidth="1px"
          borderColor="#E5E8EE"
          color="#8B5CF6"
          fontSize="13px"
          fontWeight={600}
          onClick={onRetry}
        >
          <Icon as={LuRefreshCw} boxSize="13px" />
          {t("SellerOrders.retry")}
        </Button>
      )}
    </Stack>
  );
}

function SellerOrdersContent({ initialTab }: { initialTab: SellerInboxTab }) {
  const { t, i18n } = useTranslation();
  const locale = currencyLocale(i18n.language);
  const [tab, setTab] = React.useState<SellerInboxTab>(initialTab);
  const [showInfo, setShowInfo] = React.useState(true);
  const [filters, setFilters] =
    React.useState<SellerOrdersFiltersValue>(INITIAL_FILTERS);

  const orders = useSellerOrders();
  const rfq = useSellerRfqs();
  const { specifications } = useProductSpecifications();
  const search = useDebouncedValue(filters.search.trim().toLowerCase(), 300);
  const [complementOrder, setComplementOrder] =
    React.useState<ProductOrder | null>(null);
  const [pendingRfqId, setPendingRfqId] = React.useState<string | null>(null);

  // Horas restantes das RFQs: atualiza a cada minuto.
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const orderNumber = (order: ProductOrder) =>
    t("SellerOrders.card.number", { id: order.id.slice(0, 8).toUpperCase() });

  // Só o pedido físico pago tem aceite na orders-api (POST /shipping/accept);
  // o aceite manual dos demais foi desativado até a integração autoritativa.
  const handleAccept = async (order: ProductOrder) => {
    if (isCheckoutOrder(order) && order.status === "awaitingPayment") {
      toaster.create({
        type: "info",
        title: t("SellerOrders.toasts.awaitingPayment"),
      });
      return;
    }
    if (!sellerOrderNeedsShippingAccept(order, orders.shippings[order.id])) {
      toaster.create({
        type: "info",
        title: t("SellerOrders.toasts.acceptUnavailable"),
      });
      return;
    }
    const result = await orders.accept(order.id);
    toaster.create(
      result === "accepted"
        ? {
            type: "success",
            title: t("SellerOrders.toasts.accepted", {
              number: orderNumber(order),
            }),
          }
        : { type: "error", title: t(`SellerOrders.toasts.accept.${result}`) },
    );
  };

  // A orders-api ainda não tem recusa com motivo nem pedido de complemento.
  const showComingSoon = () => {
    toaster.create({
      type: "info",
      title: t("SellerOrders.toasts.comingSoon"),
    });
    return false;
  };

  const runRfqAction = async (
    item: SellerRfq,
    action: () => Promise<boolean>,
  ) => {
    setPendingRfqId(item.id);
    try {
      const ok = await action();
      if (!ok) {
        toaster.create({
          type: "error",
          title: t("SellerOrders.rfq.toasts.notOpen"),
        });
      }
      return ok;
    } finally {
      setPendingRfqId(null);
    }
  };

  const handleSendProposal = (item: SellerRfq, draft: SellerRfqProposalDraft) =>
    runRfqAction(item, async () => {
      const updated = await rfq.sendProposal(item.id, draft);
      if (updated?.proposal) {
        toaster.create({
          type: "success",
          title: t("SellerOrders.rfq.toasts.proposalSent", {
            id: updated.id,
            version: updated.proposal.version,
          }),
        });
      }
      return !!updated;
    });

  const handleDeclineRfq = (item: SellerRfq, reason: string) =>
    runRfqAction(item, async () => {
      const ok = await rfq.decline(item.id, reason);
      if (ok) {
        toaster.create({
          type: "success",
          title: t("SellerOrders.rfq.toasts.declined", { id: item.id }),
        });
      }
      return ok;
    });

  const specification = specifications.find(
    (spec) => spec.id === filters.specificationId,
  );
  const visibleOrders = orders.orders.filter(
    (order) =>
      (filters.status === "all" ||
        sellerOrderStatus(order, orders.shippings[order.id]) ===
          filters.status) &&
      (!specification || sellerOrderHasSpecification(order, specification)) &&
      (!search ||
        order.id.toLowerCase().includes(search) ||
        sellerOrderProductNames(order).some((name) =>
          name.toLowerCase().includes(search),
        )),
  );
  const hasFilters =
    !!search || !!filters.specificationId || filters.status !== "all";

  let queue: React.ReactNode;
  if (orders.isLoading) {
    queue = (
      <Stack gap="12px" aria-busy="true">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} h="76px" rounded="12px" />
        ))}
      </Stack>
    );
  } else if (orders.errorKey) {
    queue = (
      <QueueMessage
        message={t(orders.errorKey)}
        onRetry={
          orders.errorKey === "SellerOrders.errors.forbidden"
            ? undefined
            : orders.reload
        }
      />
    );
  } else if (visibleOrders.length === 0) {
    queue = (
      <QueueMessage
        message={t(
          hasFilters ? "SellerOrders.emptyFiltered" : "SellerOrders.empty",
        )}
      />
    );
  } else {
    queue = (
      <Stack gap="12px">
        {visibleOrders.map((order) => (
          <SellerOrderCard
            key={order.id}
            order={order}
            shipping={orders.shippings[order.id]}
            locale={locale}
            href={`/seller/orders/${encodeURIComponent(order.id)}`}
            isAccepting={orders.pendingId === order.id}
            isRejecting={false}
            onAccept={() => handleAccept(order)}
            onReject={async () => showComingSoon()}
            onRequestComplement={() => setComplementOrder(order)}
          />
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
      {showInfo && <SellerOrdersInfo onDismiss={() => setShowInfo(false)} />}

      <Stack gap="4px">
        <Text
          as="h1"
          color="#0F1729"
          fontSize="24px"
          fontWeight={800}
          lineHeight="36px"
        >
          {t("SellerOrders.title")}
        </Text>
        <Text color="#8A9AB5" fontSize="14px" lineHeight="21px">
          {t("SellerOrders.subtitle")}
        </Text>
      </Stack>

      <SellerInboxTabs
        value={tab}
        counts={{ orders: orders.counts.awaiting, rfq: rfq.counts.awaiting }}
        onChange={setTab}
      />

      {tab === "orders" ? (
        <Stack gap="20px">
          {orders.criticalSla > 0 && (
            <ProposalsNotice
              tone="danger"
              title={t("SellerOrders.slaAlert.title", {
                count: orders.criticalSla,
              })}
            >
              {t("SellerOrders.slaAlert.description")}
            </ProposalsNotice>
          )}

          <SellerOrdersStats
            locale={locale}
            data={{
              monthTotal: orders.monthTotal,
              awaiting: orders.counts.awaiting,
              accepted: orders.counts.accepted,
              withIssue: orders.withIssue,
            }}
          />

          <SellerOrdersFilters
            value={filters}
            onChange={setFilters}
            specifications={specifications}
            counts={orders.counts}
          />

          {queue}
        </Stack>
      ) : (
        <Stack gap="20px">
          <SellerRfqStats
            locale={locale}
            data={{
              monthReceived: rfq.monthReceived,
              pending: rfq.counts.awaiting,
              withProposal: rfq.counts.proposalSent,
              converted: rfq.counts.converted,
              closed: rfq.counts.declined + rfq.counts.expired,
            }}
          />

          <ProposalsNotice
            tone="seller"
            title={t("SellerOrders.rfq.rules.title")}
          >
            {t("SellerOrders.rfq.rules.description")}
          </ProposalsNotice>

          {rfq.rfqs.length === 0 ? (
            <QueueMessage message={t("SellerOrders.rfq.empty")} />
          ) : (
            <Stack gap="20px">
              {rfq.rfqs.map((item) => (
                <SellerRfqCard
                  key={item.id}
                  rfq={item}
                  locale={locale}
                  now={now}
                  isPending={pendingRfqId === item.id}
                  onSendProposal={(draft) => handleSendProposal(item, draft)}
                  onDecline={(reason) => handleDeclineRfq(item, reason)}
                  onViewOrder={showComingSoon}
                />
              ))}
            </Stack>
          )}
        </Stack>
      )}

      <SellerOrderComplementDialog
        subtitle={
          complementOrder
            ? [
                orderNumber(complementOrder),
                sellerOrderProductNames(complementOrder)[0],
              ]
                .filter(Boolean)
                .join(" · ")
            : null
        }
        isPending={false}
        onClose={() => setComplementOrder(null)}
        onSubmit={showComingSoon}
      />
    </Stack>
  );
}

// Caixa de entrada do seller (Figma 2943-40679): pedidos da orders-api, com
// aceite, recusa e pedido de complemento (2948-50544, 3009-73726), e RFQs de
// compradores (2948-52347). `?tab=rfq` abre a aba das RFQs. A orders-api recebe o
// token do perfil Seller (POST /auth/context); quem não tem `order:read` vê
// o aviso dela, sem exigir a permissão da geo-api.
export default function SellerOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = React.use(searchParams);
  const initialTab = TABS.find((key) => key === tab) ?? "orders";

  return (
    <AuthenticatedLayout>
      <SellerSessionProvider requiredPermission={null}>
        <SellerOrdersContent initialTab={initialTab} />
      </SellerSessionProvider>
    </AuthenticatedLayout>
  );
}
