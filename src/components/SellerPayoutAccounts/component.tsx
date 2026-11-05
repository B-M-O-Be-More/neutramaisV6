"use client";

import { Box, Flex, Icon, Link, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { useTranslation } from "react-i18next";
import { LuBuilding2, LuPlus, LuZap } from "react-icons/lu";

import type { PayoutAccount } from "@/services/withdrawal.service";

import { SellerPayoutAccountsProps } from "./interface";

const METHOD = {
  pix: { icon: LuZap, color: "#10B981" },
  bank: { icon: LuBuilding2, color: "#8B5CF6" },
} as const;

const STATUS = {
  active: { color: "#10B981", bg: "#EDFBF5", border: "#AAECD5" },
  pending: { color: "#D29922", bg: "#FFFBEB", border: "#FDE68A" },
} as const;

function AccountRow({ account }: { account: PayoutAccount }) {
  const { t } = useTranslation();
  const method = METHOD[account.method];
  const status = STATUS[account.status];

  return (
    <Flex
      as="li"
      align="center"
      gap="12px"
      p="16px"
      bg="#F8F9FB"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="14px"
    >
      <Flex
        align="center"
        justify="center"
        boxSize="36px"
        flexShrink={0}
        bg="white"
        borderWidth="1px"
        borderColor="#E5E8EE"
        rounded="14px"
      >
        <Icon as={method.icon} boxSize="16px" color={method.color} />
      </Flex>
      <Stack gap="0" flex="1" minW={0}>
        <Flex align="center" gap="8px">
          <Text
            color="#0F1729"
            fontSize="13px"
            fontWeight={700}
            lineHeight="19.5px"
            truncate
          >
            {account.title}
          </Text>
          {account.isDefault && (
            <Box
              flexShrink={0}
              px="6px"
              py="2px"
              bg="#F3EEFF"
              borderWidth="1px"
              borderColor="#D3BFFD"
              rounded="8px"
              color="#8B5CF6"
              fontSize="9px"
              fontWeight={700}
              lineHeight="13.5px"
              textTransform="uppercase"
            >
              {t("Wallet.accounts.default")}
            </Box>
          )}
        </Flex>
        <Text color="#8A9AB5" fontSize="11px" lineHeight="16.5px" truncate>
          {account.detail}
        </Text>
      </Stack>
      <Box
        flexShrink={0}
        px="8px"
        py="2px"
        bg={status.bg}
        borderWidth="1px"
        borderColor={status.border}
        rounded="8px"
        color={status.color}
        fontSize="10px"
        fontWeight={700}
        lineHeight="15px"
      >
        {t(`Wallet.accounts.status.${account.status}`)}
      </Box>
    </Flex>
  );
}

/**
 * "Contas de recebimento" da carteira do seller (Figma 2250-22879): contas
 * para onde vão o payout e o saque, o cadastro de uma nova e o aviso de que
 * as saídas ficam bloqueadas até a conta nova ser verificada.
 */
export function SellerPayoutAccounts({
  accounts,
  addHref,
}: SellerPayoutAccountsProps) {
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
          {t("Wallet.methods.payoutTitle")}
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
        {accounts.length > 0 ? (
          <Stack as="ul" gap="8px" listStyleType="none">
            {accounts.map((account) => (
              <AccountRow key={account.id} account={account} />
            ))}
          </Stack>
        ) : (
          <Text color="#8A9AB5" fontSize="12px" lineHeight="18px">
            {t("Wallet.methods.payoutEmpty")}
          </Text>
        )}
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
          lineHeight="19.5px"
          _hover={{ textDecoration: "none", borderColor: "#A0ABB8" }}
        >
          <NextLink href={addHref}>
            <Icon as={LuPlus} boxSize="14px" />
            {t("Wallet.methods.addNew")}
          </NextLink>
        </Link>
      </Stack>

      <Stack
        gap="2px"
        p="12px"
        bg="#F3EEFF"
        borderWidth="1px"
        borderColor="#D3BFFD"
        rounded="10px"
      >
        <Text
          color="#8B5CF6"
          fontSize="12px"
          fontWeight={600}
          lineHeight="18px"
        >
          {t("Wallet.accounts.changeTitle")}
        </Text>
        <Text color="#5B21B6" fontSize="11px" lineHeight="16.5px">
          {t("Wallet.accounts.changeDescription")}
        </Text>
      </Stack>
    </Stack>
  );
}
