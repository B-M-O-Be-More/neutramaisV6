"use client";

import {
  Badge,
  Flex,
  Grid,
  Icon,
  Skeleton,
  Stack,
  Text,
  chakra,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuStore, LuTruck } from "react-icons/lu";

import { shippingMinor } from "@/functions/checkoutBody";
import type { ShippingOption } from "@/services/checkout.service";

import { CheckoutOrderCardProps } from "./interface";

function deliveryDays(
  option: ShippingOption,
): { min: number; max: number } | null {
  const { min, max } = option.totalDeliveryDays ?? {};
  if (min == null && max == null) return null;
  return { min: min ?? max!, max: max ?? min! };
}

/**
 * Um pedido do checkout (um por Seller): itens e, nos produtos físicos, a
 * transportadora escolhida para o CEP de entrega (Figma "Pedido 1 de 1").
 */
export function CheckoutOrderCard({
  index,
  total,
  sellerLabel,
  lines,
  quotes,
  shipping,
  awaitingPostalCode,
  onSelectShipping,
  formatMinor,
}: CheckoutOrderCardProps) {
  const { t } = useTranslation();

  return (
    <Stack
      as="section"
      gap={0}
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="16px"
      overflow="hidden"
    >
      <Flex align="center" gap="12px" px="20px" py="14px" bg="#F8F9FB">
        <Flex
          align="center"
          justify="center"
          boxSize="40px"
          rounded="10px"
          bg="white"
          borderWidth="1px"
          borderColor="#E5E8EE"
        >
          <Icon as={LuStore} boxSize="16px" color="#1F5AFF" />
        </Flex>
        <Stack gap="0">
          <Text
            color="#8A9AB5"
            fontSize="10px"
            fontWeight={700}
            letterSpacing="0.06em"
          >
            {t("Checkout.order.position", { index, total }).toUpperCase()}
          </Text>
          <Text as="h2" color="#0F1729" fontSize="15px" fontWeight={800}>
            {sellerLabel}
          </Text>
        </Stack>
      </Flex>

      {lines.map((line) => {
        const offeringId = line.entry.offeringId;
        const quote = quotes[offeringId];
        const selected = shipping[offeringId];
        const options =
          quote?.quote?.options.filter(
            (option) => shippingMinor(option) !== null,
          ) ?? [];
        const isPhysical = line.snapshot.productType === "physical";

        return (
          <Stack
            key={offeringId}
            gap="14px"
            px="20px"
            py="16px"
            borderTopWidth="1px"
            borderColor="#EEF0F4"
          >
            <Flex justify="space-between" align="start" gap="12px">
              <Stack gap="2px" minW={0}>
                <Text color="#0F1729" fontSize="14px" fontWeight={700}>
                  {line.snapshot.name}
                </Text>
                <Text color="#8A9AB5" fontSize="12px">
                  {t("Checkout.order.quantity", { count: line.entry.quantity })}
                </Text>
              </Stack>
              <Text
                color="#0F1729"
                fontSize="14px"
                fontWeight={800}
                flexShrink={0}
              >
                {formatMinor(line.price?.totalMinor ?? 0)}
              </Text>
            </Flex>

            {isPhysical && (
              <Stack gap="8px">
                <Flex align="center" gap="6px">
                  <Icon as={LuTruck} boxSize="13px" color="#5A6478" />
                  <Text color="#5A6478" fontSize="12px" fontWeight={600}>
                    {t("Checkout.order.carrier")}
                  </Text>
                </Flex>

                {awaitingPostalCode ? (
                  <Text color="#8A9AB5" fontSize="12px">
                    {t("Checkout.order.needsPostalCode")}
                  </Text>
                ) : quote?.status === "loading" || !quote ? (
                  <Skeleton h="56px" rounded="12px" />
                ) : quote.status === "error" ? (
                  <Text color="#DC2626" fontSize="12px" role="alert">
                    {t("Checkout.order.quoteFailed")}
                  </Text>
                ) : quote.quote?.rfqRequired ? (
                  <Text color="#B45309" fontSize="12px" role="alert">
                    {t("Checkout.order.quoteRfq")}
                  </Text>
                ) : options.length === 0 ? (
                  <Text color="#DC2626" fontSize="12px" role="alert">
                    {t("Checkout.order.noCarrier")}
                  </Text>
                ) : (
                  <Grid
                    role="radiogroup"
                    aria-label={t("Checkout.order.carrier")}
                    templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
                    gap="8px"
                  >
                    {options.map((option, optionIndex) => {
                      const checked = selected?.serviceId === option.serviceId;
                      const days = deliveryDays(option);
                      const fastest =
                        options.length > 1 &&
                        optionIndex ===
                          options.reduce(
                            (best, candidate, candidateIndex) =>
                              (deliveryDays(candidate)?.max ?? Infinity) <
                              (deliveryDays(options[best])?.max ?? Infinity)
                                ? candidateIndex
                                : best,
                            0,
                          );
                      return (
                        <chakra.button
                          key={option.serviceId}
                          type="button"
                          role="radio"
                          aria-checked={checked}
                          onClick={() => onSelectShipping(offeringId, option)}
                          textAlign="left"
                          p="12px"
                          rounded="12px"
                          borderWidth={checked ? "2px" : "1px"}
                          borderColor={checked ? "#1F5AFF" : "#E5E8EE"}
                          bg={checked ? "#F3F6FF" : "white"}
                          cursor="pointer"
                        >
                          <Flex justify="space-between" gap="8px">
                            <Text
                              color="#0F1729"
                              fontSize="13px"
                              fontWeight={700}
                            >
                              {option.carrier.name
                                ? `${option.carrier.name} ${option.serviceName}`
                                : option.serviceName}
                            </Text>
                            {optionIndex === 0 && options.length > 1 && (
                              <Badge
                                bg="#EDFBF5"
                                color="#047857"
                                fontSize="10px"
                              >
                                {t("Checkout.order.cheapest")}
                              </Badge>
                            )}
                            {fastest && optionIndex !== 0 && (
                              <Badge
                                bg="#EDFBF5"
                                color="#047857"
                                fontSize="10px"
                              >
                                {t("Checkout.order.fastest")}
                              </Badge>
                            )}
                          </Flex>
                          <Flex justify="space-between" gap="8px" mt="4px">
                            <Text color="#8A9AB5" fontSize="12px">
                              {days
                                ? t("Checkout.order.days", {
                                    count: days.max,
                                    min: days.min,
                                    max: days.max,
                                  })
                                : option.pickup
                                  ? t("Checkout.order.pickup")
                                  : ""}
                            </Text>
                            <Text
                              color="#0F1729"
                              fontSize="12px"
                              fontWeight={700}
                            >
                              {option.freeShipping
                                ? t("Checkout.order.free")
                                : formatMinor(shippingMinor(option) ?? 0)}
                            </Text>
                          </Flex>
                        </chakra.button>
                      );
                    })}
                  </Grid>
                )}
              </Stack>
            )}
          </Stack>
        );
      })}
    </Stack>
  );
}
