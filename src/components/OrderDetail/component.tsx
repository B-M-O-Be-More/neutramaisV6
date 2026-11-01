"use client";

import {
  Box,
  Button,
  Flex,
  Grid,
  Icon,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useTranslation } from "react-i18next";
import {
  LuBuilding2,
  LuChevronLeft,
  LuCreditCard,
  LuDownload,
  LuFileText,
  LuScrollText,
  LuShoppingBag,
  LuZap,
} from "react-icons/lu";

import OrderInfoCard, { type OrderInfoRow } from "@/components/OrderInfoCard";
import OrderProgress from "@/components/OrderProgress";
import OrderSideCard, { type OrderSideRow } from "@/components/OrderSideCard";
import OrderStatusCard from "@/components/OrderStatusCard";
import { ORDER_STAGE_TONES } from "@/data/orderStageTones";
import {
  orderDate,
  orderEscrowStatus,
  orderHasPhysicalItems,
  orderStage,
  orderStageTone,
} from "@/functions/orderStage";
import { isCheckoutOrder } from "@/services/orders.service";

import { OrderDetailProps } from "./interface";

/** Número curto do pedido, como na lista: #E2B7D4A9. */
function orderNumber(id: string) {
  return `#${id.slice(0, 8).toUpperCase()}`;
}

/**
 * Detalhe de um pedido (Figma 2191-17812) para o Buyer ou o Seller dele:
 * progresso, a outra parte, pagamento e escrow, nota fiscal (físico),
 * contrato (serviço), status atual, resumo e valores. Mostra só o que a
 * orders-api devolve.
 */
export function OrderDetail({
  order,
  shipping,
  perspective,
  locale,
  backHref,
  backLabel,
  contractsHref,
  isDownloadingInvoice,
  onDownloadInvoice,
}: OrderDetailProps) {
  const { t } = useTranslation();
  const isCheckout = isCheckoutOrder(order);
  const isPhysical = orderHasPhysicalItems(order);
  const stage = orderStage(order);
  const tone = ORDER_STAGE_TONES[orderStageTone(stage)];
  const number = orderNumber(order.id);

  const money = (minor: number, currency: string) =>
    new Intl.NumberFormat(locale, { style: "currency", currency }).format(
      minor / 100,
    );
  const reais = (value: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "BRL",
    }).format(value);
  const formatDate = (value: Date | null) =>
    value ? new Intl.DateTimeFormat(locale).format(value) : "—";

  const items = isCheckout
    ? order.items.map((item) => ({
        name: item.catalog.name,
        quantity: item.quantity,
        category: item.catalog.specification?.name ?? null,
      }))
    : order.items.map((item) => ({
        name: item.offeringName,
        quantity: item.quantity,
        category: item.specificationName,
      }));
  const [first] = items;
  const title = first
    ? items.length > 1
      ? `${first.name} ${t("OrderDetail.more", { count: items.length - 1 })}`
      : first.name
    : t("OrderDetail.noItems");
  const category = first?.category ?? null;
  const createdAt = orderDate(order.createdAt);

  const total = isCheckout
    ? money(order.totalMinor, order.currency)
    : t("OrderDetail.monthly", { value: reais(order.totalMonthly) });

  const counterpartyId =
    perspective === "buyer"
      ? order.sellerOrganizationId
      : order.buyerOrganizationId;
  const escrow = orderEscrowStatus(order);

  // Status atual: o cancelamento em andamento vale mais que a etapa.
  const caption =
    isCheckout && order.cancellationStatus === "barrierPending"
      ? t("OrderDetail.captions.cancellationPending")
      : isCheckout && order.cancellationStatus === "barrierRejected"
        ? t("OrderDetail.captions.cancellationRejected")
        : !isCheckout && stage === "rejected" && order.rejectionReason
          ? order.rejectionReason
          : t(`OrderDetail.captions.${perspective}.${stage}`);

  // ---- Pagamento e escrow
  let paymentRows: OrderInfoRow[];
  if (isCheckout) {
    const method =
      order.walletMinor > 0 && order.cardMinor > 0
        ? t("OrderDetail.payment.methods.split", {
            wallet: money(order.walletMinor, order.currency),
            card: money(order.cardMinor, order.currency),
          })
        : order.walletMinor > 0
          ? t("OrderDetail.payment.methods.wallet")
          : t("OrderDetail.payment.methods.card");
    paymentRows = [
      { key: "method", label: t("OrderDetail.payment.method"), value: method },
      { key: "total", label: t("OrderDetail.payment.total"), value: total },
      {
        key: "currency",
        label: t("OrderDetail.payment.currency"),
        value: order.currency,
      },
      {
        key: "escrow",
        label: t("OrderDetail.payment.escrow"),
        value: t(`OrderDetail.escrow.${escrow}`),
      },
    ];
    if (!isPhysical) {
      paymentRows.push({
        key: "contract",
        label: t("OrderDetail.payment.contract"),
        value: order.contractId ?? t("OrderDetail.contract.pending"),
        copyValue: order.contractId ?? undefined,
      });
    }
  } else {
    paymentRows = [
      {
        key: "monthly",
        label: t("OrderDetail.payment.monthly"),
        value: reais(order.totalMonthly),
      },
      {
        key: "installation",
        label: t("OrderDetail.payment.installation"),
        value: reais(order.totalInstallation),
      },
      {
        key: "currency",
        label: t("OrderDetail.payment.currency"),
        value: "BRL",
      },
    ];
  }

  // ---- Valor do pedido
  let valueRows: OrderSideRow[];
  if (isCheckout) {
    const subtotal = order.items.reduce(
      (sum, item) => sum + item.totalMinor,
      0,
    );
    const feeBps = order.snapshot?.platformFeeBps;
    const feeLabel =
      feeBps !== undefined
        ? t("OrderDetail.value.feeRate", {
            rate: new Intl.NumberFormat(locale, {
              maximumFractionDigits: 2,
            }).format(feeBps / 100),
          })
        : t("OrderDetail.value.fee");
    valueRows =
      perspective === "seller"
        ? [
            {
              key: "total",
              label: t("OrderDetail.value.orderTotal"),
              value: total,
            },
            {
              key: "fee",
              label: feeLabel,
              value: `− ${money(order.platformFeeMinor, order.currency)}`,
            },
            {
              key: "net",
              label: t("OrderDetail.value.net"),
              value: money(
                order.totalMinor - order.platformFeeMinor,
                order.currency,
              ),
              emphasis: true,
            },
          ]
        : [
            {
              key: "subtotal",
              label: t("OrderDetail.value.subtotal"),
              value: money(subtotal, order.currency),
            },
            ...(order.creditedMinor > 0
              ? [
                  {
                    key: "credited",
                    label: t("OrderDetail.value.credited"),
                    value: money(order.creditedMinor, order.currency),
                  },
                ]
              : []),
            {
              key: "total",
              label: t("OrderDetail.value.total"),
              value: total,
              emphasis: true,
            },
          ];
  } else {
    valueRows = [
      {
        key: "monthly",
        label: t("OrderDetail.payment.monthly"),
        value: reais(order.totalMonthly),
      },
      {
        key: "installation",
        label: t("OrderDetail.payment.installation"),
        value: reais(order.totalInstallation),
      },
      {
        key: "total",
        label: t("OrderDetail.value.total"),
        value: total,
        emphasis: true,
      },
    ];
  }

  const summaryRows: OrderSideRow[] = [
    { key: "id", label: t("OrderDetail.summary.id"), value: number },
    { key: "product", label: t("OrderDetail.summary.product"), value: title },
    {
      key: "category",
      label: t("OrderDetail.summary.category"),
      value: category ?? "—",
    },
    {
      key: "counterparty",
      label: t(`OrderDetail.summary.counterparty.${perspective}`),
      value: counterpartyId.slice(0, 8).toUpperCase(),
    },
    {
      key: "created",
      label: t("OrderDetail.summary.created"),
      value: formatDate(createdAt),
    },
  ];
  if (!isCheckout && order.updatedAt) {
    summaryRows.push({
      key: "updated",
      label: t("OrderDetail.summary.updated"),
      value: formatDate(orderDate(order.updatedAt)),
    });
  }

  const tracking =
    shipping?.tracking ??
    shipping?.labels.find((label) => label.tracking)?.tracking ??
    null;

  return (
    <Stack
      maxW="1280px"
      px={{ base: 4, md: "32px" }}
      py={{ base: 6, md: "28px" }}
      gap="24px"
    >
      <Flex align="center" gap="12px" wrap="wrap">
        <Button
          asChild
          variant="plain"
          h="auto"
          px="8px"
          py="6px"
          gap="8px"
          color="#8A9AB5"
          fontSize="14px"
          fontWeight={500}
          lineHeight="21px"
          _hover={{ color: "#5A6478" }}
        >
          <NextLink href={backHref}>
            <Icon as={LuChevronLeft} boxSize="18px" />
            {backLabel}
          </NextLink>
        </Button>
        <Text aria-hidden color="#E5E8EE" fontSize="16px" lineHeight="24px">
          /
        </Text>
        <Text
          color="#0F1729"
          fontSize="14px"
          fontWeight={600}
          lineHeight="21px"
        >
          {number}
        </Text>
      </Flex>

      <Flex
        align="flex-start"
        justify="space-between"
        direction={{ base: "column", md: "row" }}
        gap="12px"
      >
        <Stack gap="4px" minW={0}>
          <Text
            as="h1"
            color="#0F1729"
            fontSize="22px"
            fontWeight={800}
            lineHeight="27.5px"
          >
            {title}
          </Text>
          <Text color="#8A9AB5" fontSize="13px" lineHeight="19.5px">
            {[
              t("OrderDetail.number", { number }),
              category,
              createdAt &&
                t("OrderDetail.createdAt", { date: formatDate(createdAt) }),
            ]
              .filter(Boolean)
              .join(" · ")}
          </Text>
        </Stack>
        <Flex align="center" gap="12px" flexShrink={0}>
          <Flex
            align="center"
            gap="6px"
            px="12px"
            py="6px"
            rounded="14px"
            borderWidth="1px"
            borderColor={tone.border}
            bg={tone.bg}
          >
            <Box boxSize="8px" rounded="full" bg={tone.accent} />
            <Text
              color={tone.accent}
              fontSize="12px"
              fontWeight={600}
              lineHeight="18px"
            >
              {t(`OrderDetail.stages.${stage}`)}
            </Text>
          </Flex>
          <Text
            color="#0F1729"
            fontSize="20px"
            fontWeight={800}
            lineHeight="30px"
          >
            {total}
          </Text>
        </Flex>
      </Flex>

      <OrderProgress stage={stage} />

      <Grid
        templateColumns={{ base: "1fr", lg: "minmax(0, 2fr) minmax(0, 1fr)" }}
        gap="20px"
        alignItems="start"
      >
        <Stack gap="20px" minW={0}>
          <OrderInfoCard
            icon={perspective === "buyer" ? LuBuilding2 : LuShoppingBag}
            iconColor="#1F5AFF"
            title={t(`OrderDetail.counterparty.title.${perspective}`)}
            rows={[
              {
                key: "organization",
                label: t("OrderDetail.counterparty.organization"),
                value: counterpartyId,
                copyValue: counterpartyId,
              },
              ...(!isCheckout && order.note
                ? [
                    {
                      key: "note",
                      label: t("OrderDetail.counterparty.note"),
                      value: order.note,
                    },
                  ]
                : []),
            ]}
          />

          <OrderInfoCard
            icon={LuCreditCard}
            iconColor="#8B5CF6"
            title={t("OrderDetail.payment.title")}
            rows={paymentRows}
            note={isCheckout ? t("OrderDetail.payment.note") : undefined}
          />

          {isPhysical && (
            <OrderInfoCard
              icon={LuFileText}
              iconColor="#10B981"
              title={t("OrderDetail.invoice.title")}
              rows={[
                {
                  key: "key",
                  label: t("OrderDetail.invoice.key"),
                  value: shipping?.invoiceKey ?? "—",
                  copyValue: shipping?.invoiceKey ?? undefined,
                },
                {
                  key: "status",
                  label: t("OrderDetail.invoice.status"),
                  value: t(
                    shipping?.invoiceAttached
                      ? "OrderDetail.invoice.attached"
                      : "OrderDetail.invoice.pending",
                  ),
                },
                {
                  key: "tracking",
                  label: t("OrderDetail.invoice.tracking"),
                  value: tracking ?? "—",
                  copyValue: tracking ?? undefined,
                },
                {
                  key: "received",
                  label: t("OrderDetail.invoice.received"),
                  value: t(
                    shipping?.received
                      ? "OrderDetail.invoice.receivedYes"
                      : "OrderDetail.invoice.receivedNo",
                  ),
                },
              ]}
              actions={
                shipping?.invoiceAttached ? (
                  <Button
                    variant="plain"
                    h="36px"
                    px="12px"
                    gap="8px"
                    rounded="10px"
                    borderWidth="1px"
                    borderColor="#AAECD5"
                    bg="#EDFBF5"
                    color="#10B981"
                    fontSize="12px"
                    fontWeight={600}
                    loading={isDownloadingInvoice}
                    _hover={{ bg: "#DDF7EC" }}
                    onClick={onDownloadInvoice}
                  >
                    <Icon as={LuDownload} boxSize="13px" />
                    {t("OrderDetail.invoice.download")}
                  </Button>
                ) : undefined
              }
            />
          )}

          {!isPhysical && (
            <OrderInfoCard
              icon={LuScrollText}
              iconColor="#8B5CF6"
              title={t("OrderDetail.contract.title")}
              actions={
                contractsHref ? (
                  <Button
                    asChild
                    variant="plain"
                    h="33px"
                    px="12px"
                    rounded="10px"
                    borderWidth="1px"
                    borderColor="#D3BFFD"
                    bg="#F3EEFF"
                    color="#8B5CF6"
                    fontSize="12px"
                    fontWeight={600}
                    _hover={{ bg: "#E9E0FF" }}
                  >
                    <NextLink href={contractsHref}>
                      {t("OrderDetail.contract.goTo")}
                    </NextLink>
                  </Button>
                ) : undefined
              }
            >
              <Flex
                gap="12px"
                align="flex-start"
                px="20px"
                py="16px"
                borderBottomWidth="1px"
                borderColor="#F4F6F9"
              >
                <Flex
                  align="center"
                  justify="center"
                  boxSize="44px"
                  flexShrink={0}
                  bg="#F3EEFF"
                  borderWidth="1px"
                  borderColor="#8B5CF6"
                  rounded="14px"
                >
                  <Icon as={LuZap} boxSize="16px" color="#8B5CF6" aria-hidden />
                </Flex>
                <Stack gap={0} minW={0}>
                  <Text
                    color="#8A9AB5"
                    fontSize="9px"
                    lineHeight="13.5px"
                    letterSpacing="0.45px"
                    textTransform="uppercase"
                  >
                    {t("OrderDetail.contract.reference")}
                  </Text>
                  <Text
                    color="#0F1729"
                    fontSize="15px"
                    fontWeight={800}
                    lineHeight="22.5px"
                    wordBreak="break-all"
                  >
                    {isCheckout && order.contractId
                      ? order.contractId
                      : t("OrderDetail.contract.pending")}
                  </Text>
                </Stack>
              </Flex>
              <SimpleGrid
                columns={{ base: 1, md: 2 }}
                columnGap="24px"
                rowGap="10px"
                px="20px"
                py="16px"
                bg="#FCFCFD"
              >
                {[
                  {
                    key: "object",
                    value: items
                      .map((item) => `${item.quantity}× ${item.name}`)
                      .join(", "),
                  },
                  {
                    key: "value",
                    value:
                      isCheckout && order.platformFeeMinor > 0
                        ? t("OrderDetail.contract.valueWithFee", {
                            total,
                            fee: money(order.platformFeeMinor, order.currency),
                          })
                        : total,
                  },
                  {
                    key: "payment",
                    value: escrow ? t(`OrderDetail.escrow.${escrow}`) : "—",
                  },
                ].map((field) => (
                  <Stack key={field.key} gap={0} minW={0}>
                    <Text
                      color="#A0ABB8"
                      fontSize="9px"
                      lineHeight="13.5px"
                      textTransform="uppercase"
                    >
                      {t(`OrderDetail.contract.fields.${field.key}`)}
                    </Text>
                    <Text color="#0F1729" fontSize="12px" lineHeight="18px">
                      {field.value}
                    </Text>
                  </Stack>
                ))}
              </SimpleGrid>
            </OrderInfoCard>
          )}
        </Stack>

        <Stack gap="16px" minW={0}>
          <OrderStatusCard stage={stage} caption={caption} />
          <OrderSideCard
            title={t("OrderDetail.summary.title")}
            rows={summaryRows}
          />
          <OrderSideCard
            title={t("OrderDetail.value.title")}
            rows={valueRows}
          />
        </Stack>
      </Grid>
    </Stack>
  );
}
