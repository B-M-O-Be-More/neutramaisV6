"use client";

import { Flex, Icon, IconButton, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuBox, LuMinus, LuPlus, LuTrash2, LuTruck } from "react-icons/lu";

import { CartItemRowProps } from "./interface";

// Degradês das miniaturas (Figma 2879-94537): azul, índigo e verde-petróleo.
const THUMBNAILS = [
  "linear-gradient(135deg, #1F5AFF 0%, #6D92FF 100%)",
  "linear-gradient(135deg, #3155A6 0%, #7B93CE 100%)",
  "linear-gradient(135deg, #0F766E 0%, #38B2A6 100%)",
];

/**
 * Item do carrinho (Figma 2879-94537): categoria, nome, prazo, quantidade e
 * preço da linha na faixa da quantidade, como o checkout cobra.
 */
export function CartItemRow({
  line,
  index,
  locale,
  onQuantityChange,
  onRemove,
}: CartItemRowProps) {
  const { t } = useTranslation();
  const { entry, snapshot, price, maxQuantity, problem } = line;
  const currency = snapshot.currency ?? "BRL";
  const money = (minor: number) =>
    new Intl.NumberFormat(locale, { style: "currency", currency }).format(
      minor / 100,
    );

  const isPhysical = snapshot.productType === "physical";
  const days = isPhysical
    ? snapshot.shipping?.postingDays
    : snapshot.specification?.estimatedInstallationDays;
  const lead =
    days === undefined || days === null
      ? null
      : t(isPhysical ? "Cart.item.shipping" : "Cart.item.activation", {
          count: days,
        });

  return (
    <Flex
      as="li"
      gap="16px"
      align="flex-start"
      p="20px"
      borderBottomWidth="1px"
      borderColor="#F0F2F7"
    >
      <Flex
        align="center"
        justify="center"
        boxSize={{ base: "64px", md: "96px" }}
        flexShrink={0}
        rounded="12px"
        backgroundImage={THUMBNAILS[index % THUMBNAILS.length]}
        boxShadow="0px 1px 1.5px rgba(0,0,0,0.1), 0px 1px 1px rgba(0,0,0,0.1)"
        aria-hidden
      >
        <Icon as={LuBox} boxSize={{ base: "20px", md: "28px" }} color="white" />
      </Flex>

      <Stack gap="16px" flex="1" minW={0}>
        <Flex align="flex-start" justify="space-between" gap="12px">
          <Stack gap="4px" minW={0}>
            {snapshot.specification && (
              <Text
                color="#8A9AB5"
                fontSize="10px"
                fontWeight={700}
                lineHeight="15px"
                letterSpacing="0.4px"
                textTransform="uppercase"
              >
                {snapshot.specification.name}
              </Text>
            )}
            <Text
              as="h3"
              color="#0F1729"
              fontSize="14px"
              fontWeight={700}
              lineHeight="21px"
            >
              {snapshot.name}
            </Text>
            {lead && (
              <Flex align="center" gap="6px" pt="4px">
                <Icon as={LuTruck} boxSize="12px" color="#10B981" />
                <Text color="#6F7B90" fontSize="12px" lineHeight="18px">
                  {lead}
                </Text>
              </Flex>
            )}
            {problem && (
              <Text
                role="alert"
                color="#DC2626"
                fontSize="12px"
                lineHeight="18px"
              >
                {t(`Cart.item.problems.${problem}`, { max: maxQuantity })}
              </Text>
            )}
          </Stack>
          <IconButton
            aria-label={t("Cart.item.remove", { name: snapshot.name })}
            variant="plain"
            boxSize="32px"
            minW="32px"
            rounded="8px"
            color="#8A9AB5"
            flexShrink={0}
            _hover={{ bg: "#FEF2F2", color: "#EF4444" }}
            onClick={onRemove}
          >
            <Icon as={LuTrash2} boxSize="14px" />
          </IconButton>
        </Flex>

        <Flex align="flex-end" justify="space-between" gap="12px" wrap="wrap">
          <Flex
            role="group"
            aria-label={t("Cart.item.quantity", { name: snapshot.name })}
            align="center"
            p="4px"
            bg="#F8F9FB"
            borderWidth="1px"
            borderColor="#DCE2EC"
            rounded="8px"
          >
            <IconButton
              aria-label={t("Cart.item.decrease")}
              variant="plain"
              boxSize="28px"
              minW="28px"
              rounded="6px"
              color="#5A6478"
              disabled={entry.quantity <= 1}
              _hover={{ bg: "white" }}
              onClick={() => onQuantityChange(entry.quantity - 1)}
            >
              <Icon as={LuMinus} boxSize="13px" />
            </IconButton>
            <Text
              minW="32px"
              textAlign="center"
              color="#0F1729"
              fontSize="13px"
              fontWeight={700}
              lineHeight="19.5px"
              aria-live="polite"
            >
              {entry.quantity}
            </Text>
            <IconButton
              aria-label={t("Cart.item.increase")}
              variant="plain"
              boxSize="28px"
              minW="28px"
              rounded="6px"
              color="#5A6478"
              disabled={entry.quantity >= maxQuantity}
              _hover={{ bg: "white" }}
              onClick={() => onQuantityChange(entry.quantity + 1)}
            >
              <Icon as={LuPlus} boxSize="13px" />
            </IconButton>
          </Flex>

          {price && (
            <Stack gap="2px" align="flex-end" textAlign="right">
              <Text
                color="#0F1729"
                fontSize="15px"
                fontWeight={700}
                lineHeight="22.5px"
              >
                {money(price.totalMinor)}
              </Text>
              <Text color="#8A9AB5" fontSize="11px" lineHeight="16.5px">
                {price.parts
                  .map((part) =>
                    t(
                      part.price.priceType === "recurring"
                        ? "Cart.item.perMonth"
                        : "Cart.item.perUnit",
                      { price: money(part.unitMinor) },
                    ),
                  )
                  .join(" · ")}
              </Text>
            </Stack>
          )}
        </Flex>
      </Stack>
    </Flex>
  );
}
