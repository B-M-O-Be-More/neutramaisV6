"use client";

import {
  Button,
  chakra,
  Flex,
  Icon,
  IconButton,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { Trans, useTranslation } from "react-i18next";
import { LuCircleAlert, LuCircleCheckBig, LuCopy } from "react-icons/lu";

import { toaster } from "@/components/ui/toaster";

import { WithdrawReceiptProps } from "./interface";

/**
 * "Saque solicitado!" (Figma 2215-29463): o protocolo para acompanhamento
 * (com cópia), valor, destino, previsão e situação.
 */
export function WithdrawReceipt({
  protocol,
  netAmount,
  account,
  mode,
  walletHref,
}: WithdrawReceiptProps) {
  const { t } = useTranslation();

  const copyProtocol = async () => {
    try {
      await navigator.clipboard.writeText(protocol);
      toaster.create({
        type: "success",
        title: t("Wallet.withdraw.receipt.copied"),
      });
    } catch {
      // Sem permissão de área de transferência: o protocolo segue na tela.
    }
  };

  const rows = [
    { key: "amount", value: netAmount },
    { key: "destination", value: account.detail },
    { key: "forecast", value: t(`Wallet.withdraw.modes.${mode}.forecast`) },
    { key: "status", value: t("Wallet.withdraw.receipt.processing") },
  ];

  return (
    <Stack align="center" gap="24px" textAlign="center">
      <Flex
        align="center"
        justify="center"
        boxSize="80px"
        bg="#EDFBF5"
        borderWidth="2px"
        borderColor="#10B981"
        rounded="full"
      >
        <Icon as={LuCircleCheckBig} boxSize="36px" color="#10B981" />
      </Flex>
      <Stack gap="4px">
        <Text
          as="h1"
          color="#0F1729"
          fontSize="26px"
          fontWeight={800}
          lineHeight="39px"
        >
          {t("Wallet.withdraw.receipt.title")}
        </Text>
        <Text color="#8A9AB5" fontSize="14px" lineHeight="21px">
          {t("Wallet.withdraw.receipt.subtitle", {
            amount: netAmount,
            destination: account.title,
          })}
        </Text>
      </Stack>

      <Stack
        as="dl"
        gap="0"
        w="full"
        bg="white"
        borderWidth="1px"
        borderColor="#E5E8EE"
        rounded="16px"
        overflow="hidden"
        textAlign="start"
      >
        <Flex
          align="center"
          justify="space-between"
          gap="16px"
          px="20px"
          py="14px"
          borderBottomWidth="1px"
          borderColor="#F4F6F9"
        >
          <Text as="dt" color="#8A9AB5" fontSize="12px" lineHeight="18px">
            {t("Wallet.withdraw.receipt.rows.protocol")}
          </Text>
          <Flex as="dd" align="center" gap="8px">
            <Text color="#0F1729" fontSize="12px" fontWeight={700}>
              {protocol}
            </Text>
            <IconButton
              variant="plain"
              size="2xs"
              minW="auto"
              color="#A0ABB8"
              aria-label={t("Wallet.withdraw.receipt.copy")}
              onClick={copyProtocol}
            >
              <Icon as={LuCopy} boxSize="12px" />
            </IconButton>
          </Flex>
        </Flex>
        {rows.map((row, index) => (
          <Flex
            key={row.key}
            align="center"
            justify="space-between"
            gap="16px"
            px="20px"
            py="14px"
            borderBottomWidth={index < rows.length - 1 ? "1px" : 0}
            borderColor="#F4F6F9"
          >
            <Text as="dt" color="#8A9AB5" fontSize="12px" lineHeight="18px">
              {t(`Wallet.withdraw.receipt.rows.${row.key}`)}
            </Text>
            <Text
              as="dd"
              color="#0F1729"
              fontSize="12px"
              fontWeight={700}
              lineHeight="18px"
              textAlign="right"
            >
              {row.value}
            </Text>
          </Flex>
        ))}
      </Stack>

      <Flex
        align="flex-start"
        gap="10px"
        w="full"
        px="16px"
        py="12px"
        bg="#FFFBEB"
        borderWidth="1px"
        borderColor="#FDE68A"
        rounded="14px"
        textAlign="start"
      >
        <Icon
          as={LuCircleAlert}
          boxSize="14px"
          mt="2px"
          color="#D97706"
          flexShrink={0}
        />
        <Text color="#92400E" fontSize="12px" lineHeight="18px">
          <Trans
            i18nKey="Wallet.withdraw.receipt.hint"
            values={{ protocol }}
            components={{ strong: <chakra.strong fontWeight={700} /> }}
          />
        </Text>
      </Flex>

      <Button
        asChild
        w="full"
        h="41px"
        bg="#1F5AFF"
        rounded="16px"
        color="white"
        fontSize="15px"
        fontWeight={700}
        _hover={{ bg: "#1A4FE0" }}
      >
        <NextLink href={walletHref}>
          {t("Wallet.withdraw.receipt.back")}
        </NextLink>
      </Button>
    </Stack>
  );
}
