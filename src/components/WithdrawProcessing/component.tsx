"use client";

import { Flex, Icon, Spinner, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuRefreshCw } from "react-icons/lu";

const CHECKS = ["pin", "balance", "transfer"] as const;

/**
 * "Processando saque..." (Figma 2215-28731), enquanto a autorização não
 * volta. As verificações aparecem em andamento — quem as confirma é o
 * backend; com a resposta, o fluxo segue para o comprovante.
 */
export function WithdrawProcessing() {
  const { t } = useTranslation();

  return (
    <Stack
      role="status"
      aria-live="polite"
      align="center"
      gap="24px"
      py="64px"
      textAlign="center"
    >
      <Flex
        align="center"
        justify="center"
        boxSize="80px"
        bg="#EEF3FF"
        borderWidth="2px"
        borderColor="#C7D8FF"
        rounded="full"
      >
        <Icon
          as={LuRefreshCw}
          boxSize="34px"
          color="#1F5AFF"
          animation="spin 1.2s linear infinite"
        />
      </Flex>
      <Stack gap="4px">
        <Text
          as="h1"
          color="#0F1729"
          fontSize="22px"
          fontWeight={800}
          lineHeight="33px"
        >
          {t("Wallet.withdraw.processing.title")}
        </Text>
        <Text color="#8A9AB5" fontSize="14px" lineHeight="21px">
          {t("Wallet.withdraw.processing.subtitle")}
        </Text>
      </Stack>
      <Stack as="ul" gap="10px" w="full" maxW="320px" listStyleType="none">
        {CHECKS.map((check) => (
          <Flex
            as="li"
            key={check}
            align="center"
            gap="12px"
            px="16px"
            py="12px"
            bg="white"
            borderWidth="1px"
            borderColor="#E5E8EE"
            rounded="14px"
          >
            <Spinner size="xs" color="#10B981" borderWidth="1.5px" />
            <Text color="#5A6478" fontSize="13px" lineHeight="19.5px">
              {t(`Wallet.withdraw.processing.checks.${check}`)}
            </Text>
          </Flex>
        ))}
      </Stack>
    </Stack>
  );
}
