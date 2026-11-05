"use client";

import { Flex, Icon, Link, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { useTranslation } from "react-i18next";
import { LuPlus } from "react-icons/lu";

import WalletHint from "@/components/WalletHint";

import { WalletMethodsCardProps } from "./interface";

/**
 * Card de "Métodos de pagamento" / "Contas de recebimento" da carteira
 * (Figma 2250-22289 e 2250-22879).
 *
 * A lista ainda não tem endpoint (métodos e contas ficam no serviço de
 * pagamentos): o card mostra o vazio e leva ao cadastro.
 */
export function WalletMethodsCard({
  title,
  addHref,
  emptyLabel,
  hint,
}: WalletMethodsCardProps) {
  const { t } = useTranslation();

  return (
    <Stack
      gap="16px"
      p="20px"
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="14px"
    >
      <Flex align="center" justify="space-between" gap="12px">
        <Text
          as="h2"
          color="#0F1729"
          fontSize="15px"
          fontWeight={700}
          lineHeight="22.5px"
        >
          {title}
        </Text>
        <Link
          asChild
          gap="6px"
          color="#1F5AFF"
          fontSize="13px"
          fontWeight={600}
          lineHeight="19.5px"
        >
          <NextLink href={addHref}>
            <Icon as={LuPlus} boxSize="13px" />
            {t("Wallet.methods.add")}
          </NextLink>
        </Link>
      </Flex>

      <Stack gap="8px">
        <Text color="#A0ABB8" fontSize="12px" lineHeight="18px">
          {emptyLabel}
        </Text>
        <Link
          asChild
          justifyContent="center"
          gap="8px"
          h="57px"
          bg="#F8F9FB"
          borderWidth="1px"
          borderStyle="dashed"
          borderColor="#C4CDD8"
          rounded="15px"
          color="#A0ABB8"
          fontSize="13px"
          fontWeight={500}
          textDecoration="none"
          _hover={{ borderColor: "#1F5AFF", color: "#1F5AFF" }}
        >
          <NextLink href={addHref}>
            <Icon as={LuPlus} boxSize="14px" />
            {t("Wallet.methods.addNew")}
          </NextLink>
        </Link>
      </Stack>

      <WalletHint
        tone={hint.tone}
        title={hint.title}
        description={hint.description}
      />
    </Stack>
  );
}
