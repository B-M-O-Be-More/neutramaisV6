"use client";

import {
  Button,
  Flex,
  Grid,
  Icon,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useTranslation } from "react-i18next";
import { LuArrowRight, LuCheck, LuClock, LuX } from "react-icons/lu";

import type { CheckoutOutcome } from "@/hooks/useCheckoutFlow";

import { CheckoutResultProps } from "./interface";

const TONES: Record<
  CheckoutOutcome,
  { icon: typeof LuCheck; color: string; bg: string; border: string }
> = {
  success: {
    icon: LuCheck,
    color: "#10B981",
    bg: "#EDFBF5",
    border: "#AAECD5",
  },
  pending: {
    icon: LuClock,
    color: "#D97706",
    bg: "#FFFBEB",
    border: "#FDE68A",
  },
  approval: {
    icon: LuClock,
    color: "#D97706",
    bg: "#FFFBEB",
    border: "#FDE68A",
  },
  error: { icon: LuX, color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
};

function Info({ label, value }: { label: string; value: string }) {
  return (
    <Stack gap="2px">
      <Text
        color="#8A9AB5"
        fontSize="10px"
        fontWeight={700}
        letterSpacing="0.06em"
      >
        {label.toUpperCase()}
      </Text>
      <Text color="#0F1729" fontSize="14px" fontWeight={700}>
        {value}
      </Text>
    </Stack>
  );
}

/**
 * Passo 5 (Figma "Confirmação", "Confirmação em aguarde" e "Erro de
 * pagamento"). Sem resultado ainda, mostra o acompanhamento do pagamento.
 */
export function CheckoutResult({
  outcome,
  orderNumbers,
  totalLabel,
  onRetry,
}: CheckoutResultProps) {
  const { t } = useTranslation();

  if (!outcome) {
    return (
      <Stack
        align="center"
        gap="12px"
        py="48px"
        textAlign="center"
        role="status"
      >
        <Spinner size="lg" color="#1F5AFF" />
        <Text color="#0F1729" fontSize="16px" fontWeight={700}>
          {t("Checkout.result.following")}
        </Text>
        <Text color="#8A9AB5" fontSize="13px">
          {t("Checkout.result.followingDescription")}
        </Text>
      </Stack>
    );
  }

  const tone = TONES[outcome];
  return (
    <Stack gap="20px" align="stretch">
      <Stack align="center" gap="8px" textAlign="center" pt="8px">
        <Flex
          align="center"
          justify="center"
          boxSize="56px"
          rounded="14px"
          bg={tone.bg}
        >
          <Icon as={tone.icon} boxSize="24px" color={tone.color} />
        </Flex>
        <Text as="h2" color="#0F1729" fontSize="20px" fontWeight={800}>
          {t(`Checkout.result.${outcome}.title`)}
        </Text>
        <Text color="#8A9AB5" fontSize="13px">
          {t(`Checkout.result.${outcome}.description`)}
        </Text>
      </Stack>

      {orderNumbers.length > 0 && (
        <Grid
          templateColumns="1fr 1fr"
          gap="14px"
          p="18px"
          bg={tone.bg}
          borderWidth="1px"
          borderColor={tone.border}
          rounded="14px"
        >
          <Info
            label={t("Checkout.result.orders", { count: orderNumbers.length })}
            value={orderNumbers.join(", ")}
          />
          <Info
            label={t("Checkout.result.status")}
            value={t(`Checkout.result.${outcome}.status`)}
          />
          <Info label={t("Checkout.result.escrow")} value={totalLabel} />
        </Grid>
      )}

      <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="12px">
        {outcome === "error" ? (
          <Button variant="outline" h="44px" rounded="12px" onClick={onRetry}>
            {t("Checkout.actions.retry")}
          </Button>
        ) : (
          <Button asChild variant="outline" h="44px" rounded="12px">
            <NextLink href="/dashboard">{t("Checkout.actions.home")}</NextLink>
          </Button>
        )}
        <Button
          asChild
          h="44px"
          rounded="12px"
          bg="#1F5AFF"
          color="white"
          _hover={{ bg: "#1646CC" }}
        >
          <NextLink href="/orders">
            {t("Checkout.actions.orders")}
            <Icon as={LuArrowRight} boxSize="14px" />
          </NextLink>
        </Button>
      </Grid>
    </Stack>
  );
}
