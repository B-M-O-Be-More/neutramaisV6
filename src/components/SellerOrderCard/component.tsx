"use client";

import {
  Box,
  Button,
  Flex,
  Icon,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import React from "react";
import { useTranslation } from "react-i18next";
import type { IconType } from "react-icons";
import {
  LuCircleCheck,
  LuCircleX,
  LuClock,
  LuFileText,
  LuPackage,
  LuZap,
} from "react-icons/lu";

import FormSellerDecline from "@/components/Forms/FormSellerDecline";
import SellerOrderTimeline, {
  type SellerOrderTimelineStep,
} from "@/components/SellerOrderTimeline";
import {
  orderEscrowStatus,
  orderHasPhysicalItems,
} from "@/functions/orderStage";
import {
  hasSellerOrderIssue,
  sellerOrderCreatedAt,
  sellerOrderProductNames,
  sellerOrderStatus,
} from "@/functions/sellerOrderSummary";
import { isCheckoutOrder } from "@/services/orders.service";
import type { SellerOrderStatus } from "@/types/sellerOrders";

import { SellerOrderCardProps } from "./interface";

// Selo de status do card (Figma 2948-50655).
const STATUS_STYLES: Record<
  SellerOrderStatus,
  { color: string; bg: string; icon: IconType }
> = {
  awaiting: { color: "#D97706", bg: "#FFFBEB", icon: LuClock },
  accepted: { color: "#10B981", bg: "#EDFBF5", icon: LuCircleCheck },
  rejected: { color: "#EF4444", bg: "#FEF2F2", icon: LuCircleX },
  expired: { color: "#8A9AB5", bg: "#F4F6F9", icon: LuClock },
};

// Botões da linha de ações (Figma 2948-50666).
const ACTION_BUTTON = {
  h: "auto",
  minH: "41.5px",
  px: "12px",
  py: "10px",
  gap: "8px",
  rounded: "8px",
  fontSize: "13px",
  lineHeight: "19.5px",
} as const;

/** Número curto do pedido, como no detalhe: E2B7D4A9. */
function orderNumber(id: string) {
  return id.slice(0, 8).toUpperCase();
}

/** Célula do painel de detalhes (Figma 2948-50686). */
function InfoCell({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption?: string;
}) {
  return (
    <Stack gap="4px" p="16px" bg="white" rounded="8px" minW={0}>
      <Text
        color="#A0ABB8"
        fontSize="9px"
        fontWeight={700}
        lineHeight="13.5px"
        textTransform="uppercase"
      >
        {label}
      </Text>
      <Text color="#0F1729" fontSize="12px" fontWeight={700} lineHeight="18px">
        {value}
      </Text>
      {caption && (
        <Text color="#8A9AB5" fontSize="10px" lineHeight="15px">
          {caption}
        </Text>
      )}
    </Stack>
  );
}

/**
 * Pedido na caixa de entrada do seller (Figma 2948-50633): oferta, número,
 * data, status e total; aceitar, recusar com motivo ou pedir complemento
 * enquanto aguarda; detalhes com itens, valores e linha do tempo.
 */
export function SellerOrderCard({
  order,
  shipping,
  locale,
  href,
  isAccepting,
  isRejecting,
  onAccept,
  onReject,
  onRequestComplement,
}: SellerOrderCardProps) {
  const { t } = useTranslation();
  const [isExpanded, setExpanded] = React.useState(false);
  const [isRejectOpen, setRejectOpen] = React.useState(false);
  const detailsId = React.useId();

  const isCheckout = isCheckoutOrder(order);
  const isPhysical = orderHasPhysicalItems(order);
  const status = sellerOrderStatus(order, shipping);
  const style = STATUS_STYLES[status];
  const [firstName, ...otherNames] = sellerOrderProductNames(order);
  const createdAt = sellerOrderCreatedAt(order);
  const number = orderNumber(order.id);

  const money = (amount: number, currency: string) =>
    new Intl.NumberFormat(locale, { style: "currency", currency }).format(
      amount,
    );
  const formatDateTime = (date: Date) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: "short",
      timeStyle: "short",
    }).format(date);

  // Checkout: centavos na moeda do pedido. Antigo: mensalidade em reais.
  const total = isCheckout
    ? money(order.totalMinor / 100, order.currency)
    : t("SellerOrders.card.monthly", {
        value: money(order.totalMonthly, "BRL"),
      });

  const statusLabel =
    status === "awaiting" && isCheckout && order.status === "awaitingPayment"
      ? t("SellerOrders.card.statuses.awaitingPayment")
      : t(`SellerOrders.card.statuses.${status}`);

  const category = isCheckout
    ? order.items[0]?.catalog.specification?.name
    : order.items[0]?.specificationName;

  // ---- Detalhes: itens, valores, situação e linha do tempo
  const items = isCheckout
    ? order.items.map((item, index) => ({
        key: `${item.catalog.offeringId}-${index}`,
        name: item.catalog.name,
        quantity: item.quantity,
        total: money(item.totalMinor / 100, order.currency),
      }))
    : order.items.map((item) => ({
        key: item.id,
        name: item.offeringName,
        quantity: item.quantity,
        total: t("SellerOrders.card.monthly", {
          value: money(item.monthlyPrice * item.quantity, "BRL"),
        }),
      }));

  const feeBps = isCheckout ? order.snapshot?.platformFeeBps : undefined;
  const summary = [
    ...(feeBps !== undefined
      ? [
          {
            key: "fee",
            label: t("SellerOrders.details.fee"),
            value: new Intl.NumberFormat(locale, {
              style: "percent",
              maximumFractionDigits: 2,
            }).format(feeBps / 10_000),
          },
        ]
      : []),
    ...(!isCheckout && order.totalInstallation > 0
      ? [
          {
            key: "installation",
            label: t("SellerOrders.details.installation"),
            value: money(order.totalInstallation, "BRL"),
          },
        ]
      : []),
    { key: "total", label: t("SellerOrders.details.total"), value: total },
  ];

  const escrow = orderEscrowStatus(order);
  const paymentMethod = !isCheckout
    ? undefined
    : order.walletMinor > 0 && order.cardMinor > 0
      ? t("OrderDetail.payment.methods.split", {
          wallet: money(order.walletMinor / 100, order.currency),
          card: money(order.cardMinor / 100, order.currency),
        })
      : order.walletMinor > 0
        ? t("OrderDetail.payment.methods.wallet")
        : t("OrderDetail.payment.methods.card");

  const finalStep = isPhysical ? "invoice" : "contract";
  const finalDone = isPhysical
    ? !!shipping?.invoiceAttached
    : isCheckout && order.executionReleased;
  const isAwaitingPayment = isCheckout && order.status === "awaitingPayment";
  const timeline: SellerOrderTimelineStep[] = (
    [
      ["escrow", isAwaitingPayment ? "current" : "done"],
      ["received", isAwaitingPayment ? "pending" : "done"],
      [
        status === "accepted" ? "accepted" : "acceptance",
        status === "accepted"
          ? "done"
          : status === "awaiting" && !isAwaitingPayment
            ? "current"
            : "pending",
      ],
      [
        finalStep,
        status !== "accepted" ? "pending" : finalDone ? "done" : "current",
      ],
    ] as const
  ).map(([key, state]) => ({
    key,
    label: t(`SellerOrders.details.timeline.${key}`),
    state,
  }));

  const footer =
    status === "rejected"
      ? {
          icon: LuCircleX,
          color: "#EF4444",
          weight: 600,
          text: t(
            isCheckout && order.compensationStatus === "creditedToWallet"
              ? "SellerOrders.card.footer.rejectedCredited"
              : "SellerOrders.card.footer.rejected",
          ),
        }
      : status === "expired"
        ? {
            icon: LuClock,
            color: "#8A9AB5",
            weight: 400,
            text: t("SellerOrders.card.footer.expired"),
          }
        : null;

  const handleReject = async ({ reason }: { reason: string }) => {
    if (await onReject(reason)) setRejectOpen(false);
  };

  return (
    <Stack
      as="article"
      aria-label={t("SellerOrders.card.number", { id: number })}
      gap="16px"
      p="20px"
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="12px"
    >
      <Flex
        justify="space-between"
        align="flex-start"
        gap="12px"
        direction={{ base: "column", md: "row" }}
      >
        <Flex gap="12px" align="flex-start" minW={0}>
          <Flex
            align="center"
            justify="center"
            boxSize="40px"
            flexShrink={0}
            bg="#F3EEFF"
            borderWidth="1px"
            borderColor="#D3BFFD"
            rounded="12px"
          >
            <Icon as={LuPackage} boxSize="16px" color="#8B5CF6" aria-hidden />
          </Flex>
          <Stack gap={0} minW={0}>
            <Text
              color="#0F1729"
              fontSize="15px"
              fontWeight={700}
              lineHeight="22.5px"
            >
              {firstName ?? t("SellerOrders.card.noItems")}
              {otherNames.length > 0 &&
                ` ${t("SellerOrders.card.more", { count: otherNames.length })}`}
            </Text>
            <Text color="#8A9AB5" fontSize="12px" lineHeight="18px">
              {[category, t("SellerOrders.card.number", { id: number })]
                .filter(Boolean)
                .join(" · ")}
            </Text>
            {createdAt && (
              <Text
                pt="2px"
                color="#A0ABB8"
                fontSize="11px"
                lineHeight="16.5px"
              >
                {t("SellerOrders.card.receivedAt", {
                  date: formatDateTime(createdAt),
                })}
              </Text>
            )}
            {!isCheckout && order.rejectionReason && (
              <Flex align="center" gap="6px" pt="4px">
                <Icon as={LuFileText} boxSize="12px" color="#5A6478" />
                <Text color="#5A6478" fontSize="12px" lineHeight="18px">
                  {order.rejectionReason}
                </Text>
              </Flex>
            )}
          </Stack>
        </Flex>

        <Stack
          gap="8px"
          align={{ base: "flex-start", md: "flex-end" }}
          flexShrink={0}
        >
          <Flex gap="6px" wrap="wrap" justify="flex-end">
            {hasSellerOrderIssue(order) && (
              <Text
                as="span"
                px="12px"
                py="4px"
                rounded="8px"
                bg="#FEF2F2"
                color="#EF4444"
                fontSize="12px"
                fontWeight={600}
                lineHeight="18px"
              >
                {t("SellerOrders.card.issue")}
              </Text>
            )}
            <Flex
              align="center"
              gap="6px"
              px="12px"
              py="4px"
              rounded="8px"
              bg={style.bg}
            >
              <Icon as={style.icon} boxSize="11px" color={style.color} />
              <Text
                color={style.color}
                fontSize="12px"
                fontWeight={600}
                lineHeight="18px"
                whiteSpace="nowrap"
              >
                {statusLabel}
              </Text>
            </Flex>
          </Flex>
          <Text
            color="#0F1729"
            fontSize="16px"
            fontWeight={800}
            lineHeight="24px"
          >
            {total}
          </Text>
        </Stack>
      </Flex>

      {status === "awaiting" && (
        <Flex
          gap="8px"
          pt="12px"
          borderTopWidth="1px"
          borderColor="#F4F6F9"
          wrap="wrap"
        >
          <Button
            {...ACTION_BUTTON}
            bg="#10B981"
            color="white"
            fontWeight={700}
            boxShadow="0px 1px 1.5px rgba(0,0,0,0.1), 0px 1px 1px rgba(0,0,0,0.1)"
            _hover={{ bg: "#059669" }}
            loading={isAccepting}
            disabled={isRejecting}
            onClick={onAccept}
          >
            <Icon as={LuCircleCheck} boxSize="14px" />
            {t("SellerOrders.actions.accept")}
          </Button>
          <Button
            {...ACTION_BUTTON}
            variant="plain"
            borderWidth="1px"
            borderColor="#FECACA"
            color="#EF4444"
            fontWeight={400}
            _hover={{ bg: "#FEF2F2" }}
            aria-expanded={isRejectOpen}
            disabled={isAccepting}
            onClick={() => setRejectOpen((open) => !open)}
          >
            <Icon as={LuCircleX} boxSize="14px" />
            {t("SellerOrders.actions.reject")}
          </Button>
          <Button
            {...ACTION_BUTTON}
            variant="plain"
            ms={{ base: 0, sm: "auto" }}
            borderWidth="1px"
            borderColor="#E5E8EE"
            color="#5A6478"
            fontWeight={400}
            _hover={{ bg: "#F4F6F9" }}
            disabled={isAccepting}
            onClick={onRequestComplement}
          >
            {t("SellerOrders.actions.complement")}
          </Button>
        </Flex>
      )}

      {status === "awaiting" && isRejectOpen && (
        <FormSellerDecline
          id={`seller-order-${order.id}`}
          title={t("SellerOrders.reject.title")}
          placeholder={t("SellerOrders.reject.placeholder")}
          confirmLabel={t("SellerOrders.reject.confirm")}
          isSubmitting={isRejecting}
          onCancel={() => setRejectOpen(false)}
          onSubmit={handleReject}
        />
      )}

      {status === "accepted" && (
        <Flex
          align="center"
          gap="12px"
          pt="12px"
          borderTopWidth="1px"
          borderColor="#F4F6F9"
          wrap="wrap"
        >
          <Flex
            align="center"
            gap="8px"
            px="16px"
            py="10px"
            bg="#EDFBF5"
            borderWidth="1px"
            borderColor="#AAECD5"
            rounded="8px"
          >
            <Icon as={LuCircleCheck} boxSize="13px" color="#10B981" />
            <Text
              color="#10B981"
              fontSize="13px"
              fontWeight={700}
              lineHeight="19.5px"
            >
              {t("SellerOrders.card.accepted")}
            </Text>
          </Flex>
          <Button
            asChild
            variant="plain"
            h="auto"
            px="16px"
            py="8px"
            gap="8px"
            rounded="8px"
            borderWidth="1px"
            borderColor="#E5E8EE"
            color="#5A6478"
            fontSize="13px"
            fontWeight={400}
            lineHeight="19.5px"
            _hover={{ bg: "#F4F6F9" }}
          >
            <NextLink href={href}>
              <Icon as={LuZap} boxSize="13px" />
              {t("SellerOrders.actions.viewOrder")}
            </NextLink>
          </Button>
        </Flex>
      )}

      <Flex
        justify="flex-end"
        pt="12px"
        borderTopWidth="1px"
        borderColor="#F4F6F9"
      >
        <Button
          variant="plain"
          h="auto"
          p={0}
          color="#1F5AFF"
          fontSize="12px"
          fontWeight={600}
          lineHeight="18px"
          _hover={{ textDecoration: "underline" }}
          aria-expanded={isExpanded}
          aria-controls={detailsId}
          onClick={() => setExpanded((open) => !open)}
        >
          {t(
            isExpanded
              ? "SellerOrders.details.hide"
              : "SellerOrders.details.show",
          )}
        </Button>
      </Flex>

      {isExpanded && (
        <Stack
          id={detailsId}
          gap="12px"
          p="20px"
          bg="#F8F9FB"
          borderWidth="1px"
          borderColor="#E5E8EE"
          rounded="12px"
        >
          <SimpleGrid columns={{ base: 1, md: 3 }} gap="12px">
            <InfoCell
              label={t("SellerOrders.details.order")}
              value={`#${number}`}
              caption={createdAt ? formatDateTime(createdAt) : undefined}
            />
            {escrow && (
              <InfoCell
                label={t("SellerOrders.details.payment")}
                value={t(`OrderDetail.escrow.${escrow}`)}
                caption={paymentMethod}
              />
            )}
            {isPhysical ? (
              <InfoCell
                label={t("SellerOrders.details.shipping")}
                value={t(
                  shipping?.invoiceAttached
                    ? "SellerOrders.details.invoiceAttached"
                    : "SellerOrders.details.invoicePending",
                )}
                caption={shipping?.tracking ?? undefined}
              />
            ) : (
              isCheckout && (
                <InfoCell
                  label={t("SellerOrders.details.contract")}
                  value={t(
                    order.executionReleased
                      ? "SellerOrders.details.contractSigned"
                      : "SellerOrders.details.contractPending",
                  )}
                />
              )
            )}
          </SimpleGrid>

          <Stack gap="12px" p="16px" bg="white" rounded="8px">
            {items.length === 0 ? (
              <Text color="#8A9AB5" fontSize="12px" lineHeight="18px">
                {t("SellerOrders.card.noItems")}
              </Text>
            ) : (
              items.map((item) => (
                <Flex key={item.key} justify="space-between" gap="12px">
                  <Stack gap="4px" minW={0}>
                    <Text
                      color="#0F1729"
                      fontSize="12px"
                      fontWeight={700}
                      lineHeight="18px"
                    >
                      {item.name}
                    </Text>
                    <Text color="#8A9AB5" fontSize="10px" lineHeight="15px">
                      {t("SellerOrders.details.quantity", {
                        count: item.quantity,
                      })}
                    </Text>
                  </Stack>
                  <Text
                    color="#0F1729"
                    fontSize="13px"
                    fontWeight={800}
                    lineHeight="19.5px"
                    flexShrink={0}
                  >
                    {item.total}
                  </Text>
                </Flex>
              ))
            )}
            <SimpleGrid
              columns={{ base: 2, md: 4 }}
              gap="12px"
              pt="12px"
              borderTopWidth="1px"
              borderColor="#F4F6F9"
            >
              {summary.map((row) => (
                <Box key={row.key} fontSize="10px" lineHeight="15px">
                  <Text color="#8A9AB5">{row.label}</Text>
                  <Text color="#0F1729" fontWeight={700}>
                    {row.value}
                  </Text>
                </Box>
              ))}
            </SimpleGrid>
          </Stack>

          <SellerOrderTimeline
            title={t("SellerOrders.details.timeline.title")}
            steps={timeline}
          />

          <Flex justify="flex-end">
            <Text
              asChild
              color="#1F5AFF"
              fontSize="12px"
              fontWeight={600}
              lineHeight="18px"
              _hover={{ textDecoration: "underline" }}
            >
              <NextLink href={href}>{t("SellerOrders.details.open")}</NextLink>
            </Text>
          </Flex>
        </Stack>
      )}

      {footer && (
        <Flex
          align="center"
          gap="8px"
          pt="12px"
          borderTopWidth="1px"
          borderColor="#F4F6F9"
        >
          <Icon as={footer.icon} boxSize="13px" color={footer.color} />
          <Text
            color={footer.color}
            fontSize="12px"
            fontWeight={footer.weight}
            lineHeight="18px"
          >
            {footer.text}
          </Text>
        </Flex>
      )}
    </Stack>
  );
}
