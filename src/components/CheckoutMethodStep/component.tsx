"use client";

import { Badge, Flex, Icon, Stack, Switch, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuCheck, LuCreditCard, LuQrCode, LuWallet } from "react-icons/lu";

import { CheckoutMethodStepProps } from "./interface";

function MethodOption({
  icon,
  title,
  description,
  selected,
  disabledLabel,
}: {
  icon: typeof LuCreditCard;
  title: string;
  description: string;
  selected: boolean;
  disabledLabel?: string;
}) {
  return (
    <Flex
      role="radio"
      aria-checked={selected}
      aria-disabled={!!disabledLabel}
      align="center"
      gap="12px"
      p="14px"
      rounded="12px"
      borderWidth={selected ? "2px" : "1px"}
      borderColor={selected ? "#1F5AFF" : "#E5E8EE"}
      bg={selected ? "#F3F6FF" : "white"}
      opacity={disabledLabel ? 0.55 : 1}
    >
      <Flex
        align="center"
        justify="center"
        boxSize="36px"
        rounded="10px"
        borderWidth="1px"
        borderColor="#E5E8EE"
        bg="white"
      >
        <Icon
          as={icon}
          boxSize="16px"
          color={selected ? "#1F5AFF" : "#5A6478"}
        />
      </Flex>
      <Stack gap="0" flex="1" minW={0}>
        <Text color="#0F1729" fontSize="14px" fontWeight={700}>
          {title}
        </Text>
        <Text color="#8A9AB5" fontSize="12px">
          {description}
        </Text>
      </Stack>
      {disabledLabel ? (
        <Badge bg="#F1F3F7" color="#5A6478" fontSize="10px">
          {disabledLabel}
        </Badge>
      ) : (
        selected && <Icon as={LuCheck} boxSize="16px" color="#1F5AFF" />
      )}
    </Flex>
  );
}

/**
 * Passo 2 (Figma "Método de pagamento"): crédito Neutra+ em conjunto e o
 * método do restante. A payment-api cobra só cartão (Stripe); PIX aparece
 * como "em breve".
 */
export function CheckoutMethodStep({
  availableCreditMinor,
  useCredit,
  onUseCreditChange,
  creditMinor,
  cardMinor,
  totalMinor,
  formatMinor,
}: CheckoutMethodStepProps) {
  const { t } = useTranslation();
  const hasCredit = !!availableCreditMinor && availableCreditMinor > 0;

  return (
    <Stack gap="16px">
      <Stack
        gap="12px"
        p="20px"
        bg="white"
        borderWidth="1px"
        borderColor="#E5E8EE"
        rounded="16px"
      >
        <Text as="h2" color="#0F1729" fontSize="15px" fontWeight={700}>
          {t("Checkout.method.creditTitle")}
        </Text>
        <Switch.Root
          checked={useCredit && hasCredit}
          disabled={!hasCredit}
          onCheckedChange={(details) => onUseCreditChange(details.checked)}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          gap="12px"
        >
          <Switch.HiddenInput />
          <Switch.Label
            display="flex"
            alignItems="center"
            gap="8px"
            fontSize="13px"
          >
            <Icon as={LuWallet} boxSize="14px" color="#7C3AED" />
            <Text as="span" color="#0F1729" fontWeight={600}>
              {t("Checkout.method.creditAvailable")}
            </Text>
            <Text as="span" color="#10B981" fontWeight={700}>
              {hasCredit
                ? formatMinor(availableCreditMinor!)
                : t("Checkout.method.noCredit")}
            </Text>
          </Switch.Label>
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
        </Switch.Root>
        {creditMinor > 0 && (
          <Flex
            justify="space-between"
            px="14px"
            py="10px"
            bg="#EDFBF5"
            borderWidth="1px"
            borderColor="#AAECD5"
            rounded="10px"
          >
            <Text color="#0F1729" fontSize="13px">
              {t("Checkout.method.creditApplied")}
            </Text>
            <Text color="#10B981" fontSize="13px" fontWeight={700}>
              -{formatMinor(creditMinor)}
            </Text>
          </Flex>
        )}
      </Stack>

      {cardMinor > 0 && (
        <Stack
          gap="10px"
          p="20px"
          bg="white"
          borderWidth="1px"
          borderColor="#E5E8EE"
          rounded="16px"
        >
          <Text as="h2" color="#0F1729" fontSize="15px" fontWeight={700}>
            {t("Checkout.method.title")}{" "}
            <Text as="span" color="#1F5AFF">
              {formatMinor(cardMinor)}
            </Text>
          </Text>
          <Stack
            role="radiogroup"
            aria-label={t("Checkout.method.title")}
            gap="10px"
          >
            <MethodOption
              icon={LuQrCode}
              title={t("Checkout.method.pix")}
              description={t("Checkout.method.pixDescription")}
              selected={false}
              disabledLabel={t("Checkout.method.soon")}
            />
            <MethodOption
              icon={LuCreditCard}
              title={t("Checkout.method.card")}
              description={t("Checkout.method.cardDescription")}
              selected
            />
          </Stack>
        </Stack>
      )}

      <Flex
        justify="space-between"
        align="center"
        px="20px"
        py="16px"
        bg="#F8F9FB"
        borderWidth="1px"
        borderColor="#E5E8EE"
        rounded="16px"
      >
        <Text color="#5A6478" fontSize="13px">
          {t("Checkout.method.totalNow")}
        </Text>
        <Text color="#0F1729" fontSize="20px" fontWeight={800}>
          {formatMinor(totalMinor)}
        </Text>
      </Flex>
    </Stack>
  );
}
