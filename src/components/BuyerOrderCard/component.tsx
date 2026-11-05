"use client";

import {
  Box,
  Flex,
  Icon,
  LinkBox,
  LinkOverlay,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useTranslation } from "react-i18next";
import { LuChevronRight } from "react-icons/lu";

import { ORDER_STAGE_TONES } from "@/data/orderStageTones";
import { orderItemNames } from "@/functions/buyerOrders";
import { orderDate, orderStage, orderStageTone } from "@/functions/orderStage";
import { isCheckoutOrder } from "@/services/orders.service";

import { BuyerOrderCardProps } from "./interface";

/**
 * Linha de "Meus Pedidos": número, produto, Seller, data, etapa e total. O
 * cartão inteiro abre o detalhe do pedido.
 */
export function BuyerOrderCard({ order, href, locale }: BuyerOrderCardProps) {
  const { t } = useTranslation();
  const stage = orderStage(order);
  const tone = ORDER_STAGE_TONES[orderStageTone(stage)];
  const number = `#${order.id.slice(0, 8).toUpperCase()}`;

  const [first, ...rest] = orderItemNames(order);
  const title = first
    ? rest.length > 0
      ? `${first} ${t("OrderDetail.more", { count: rest.length })}`
      : first
    : t("OrderDetail.noItems");
  const createdAt = orderDate(order.createdAt);

  const total = isCheckoutOrder(order)
    ? new Intl.NumberFormat(locale, {
        style: "currency",
        currency: order.currency,
      }).format(order.totalMinor / 100)
    : t("OrderDetail.monthly", {
        value: new Intl.NumberFormat(locale, {
          style: "currency",
          currency: "BRL",
        }).format(order.totalMonthly),
      });

  return (
    <LinkBox
      as="article"
      px="20px"
      py="16px"
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="14px"
      transition="border-color 0.15s"
      _hover={{ borderColor: "#C7D8FF" }}
    >
      <Flex
        align={{ base: "flex-start", md: "center" }}
        justify="space-between"
        direction={{ base: "column", md: "row" }}
        gap="12px"
      >
        <Stack gap="2px" minW={0}>
          <Text color="#8A9AB5" fontSize="12px" lineHeight="18px">
            {[
              number,
              createdAt && new Intl.DateTimeFormat(locale).format(createdAt),
            ]
              .filter(Boolean)
              .join(" · ")}
          </Text>
          <LinkOverlay asChild>
            <NextLink href={href}>
              <Text
                as="h2"
                color="#0F1729"
                fontSize="15px"
                fontWeight={700}
                lineHeight="22.5px"
                lineClamp={1}
              >
                {title}
              </Text>
            </NextLink>
          </LinkOverlay>
          <Text color="#5A6478" fontSize="12px" lineHeight="18px">
            {t("BuyerOrders.seller", {
              id: order.sellerOrganizationId.slice(0, 8).toUpperCase(),
            })}
          </Text>
        </Stack>

        <Flex align="center" gap="12px" flexShrink={0}>
          <Flex
            align="center"
            gap="6px"
            px="10px"
            py="4px"
            rounded="12px"
            borderWidth="1px"
            borderColor={tone.border}
            bg={tone.bg}
          >
            <Box boxSize="7px" rounded="full" bg={tone.accent} />
            <Text
              color={tone.accent}
              fontSize="11.5px"
              fontWeight={600}
              lineHeight="17px"
            >
              {t(`OrderDetail.stages.${stage}`)}
            </Text>
          </Flex>
          <Text
            color="#0F1729"
            fontSize="15px"
            fontWeight={800}
            lineHeight="22.5px"
          >
            {total}
          </Text>
          <Icon
            as={LuChevronRight}
            boxSize="16px"
            color="#A0ABB8"
            aria-hidden
          />
        </Flex>
      </Flex>
    </LinkBox>
  );
}
