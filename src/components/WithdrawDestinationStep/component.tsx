"use client";

import { Box, chakra, Flex, Icon, Link, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { useTranslation } from "react-i18next";
import { LuBuilding2, LuCircleAlert, LuZap } from "react-icons/lu";

import WithdrawStepActions from "@/components/WithdrawStepActions";
import WithdrawStepHeading from "@/components/WithdrawStepHeading";

import { WithdrawDestinationStepProps } from "./interface";

const METHOD = {
  pix: { icon: LuZap, color: "#10B981" },
  bank: { icon: LuBuilding2, color: "#1F5AFF" },
} as const;

/**
 * Etapa "Destino" do saque (Figma 2215-26336): a conta de recebimento que
 * recebe o valor. Contas pendentes de verificação não recebem saídas.
 */
export function WithdrawDestinationStep({
  accounts,
  selectedId,
  onSelect,
  addHref,
  onBack,
  onNext,
}: WithdrawDestinationStepProps) {
  const { t } = useTranslation();

  return (
    <Stack gap="24px">
      <WithdrawStepHeading
        icon={LuBuilding2}
        title={t("Wallet.withdraw.destination.title")}
        subtitle={t("Wallet.withdraw.destination.subtitle")}
      />

      <Stack gap="12px">
        {accounts.length > 0 ? (
          <Stack
            role="radiogroup"
            aria-label={t("Wallet.withdraw.destination.title")}
            gap="12px"
          >
            {accounts.map((account) => {
              const method = METHOD[account.method];
              const isSelected = selectedId === account.id;
              const isBlocked = account.status === "pending";
              return (
                <chakra.button
                  key={account.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={isBlocked}
                  onClick={() => onSelect(account.id)}
                  display="flex"
                  alignItems="center"
                  gap="16px"
                  p="20px"
                  textAlign="start"
                  bg={isSelected ? "#EEF3FF" : "white"}
                  borderWidth="2px"
                  borderColor={isSelected ? "#1F5AFF" : "#E5E8EE"}
                  rounded="16px"
                  cursor={isBlocked ? "not-allowed" : "pointer"}
                  opacity={isBlocked ? 0.6 : 1}
                  _focusVisible={{
                    outline: "2px solid #1F5AFF",
                    outlineOffset: "2px",
                  }}
                >
                  <Flex
                    align="center"
                    justify="center"
                    boxSize="48px"
                    flexShrink={0}
                    bg="white"
                    borderWidth="1px"
                    borderColor="#E5E8EE"
                    rounded="14px"
                  >
                    <Icon
                      as={method.icon}
                      boxSize="16px"
                      color={method.color}
                    />
                  </Flex>
                  <Stack gap="0" flex="1" minW={0}>
                    <Text
                      color="#0F1729"
                      fontSize="14px"
                      fontWeight={700}
                      lineHeight="21px"
                      truncate
                    >
                      {account.title}
                    </Text>
                    <Text
                      color="#8A9AB5"
                      fontSize="12px"
                      fontWeight={500}
                      lineHeight="18px"
                      truncate
                    >
                      {isBlocked
                        ? t("Wallet.withdraw.destination.pending")
                        : account.detail}
                    </Text>
                  </Stack>
                  <Flex
                    align="center"
                    justify="center"
                    boxSize="20px"
                    flexShrink={0}
                    bg={isSelected ? "#1F5AFF" : "white"}
                    borderWidth="2px"
                    borderColor={isSelected ? "#1F5AFF" : "#C4CDD8"}
                    rounded="full"
                  >
                    {isSelected && (
                      <Box boxSize="8px" rounded="full" bg="white" />
                    )}
                  </Flex>
                </chakra.button>
              );
            })}
          </Stack>
        ) : (
          <Text
            px="20px"
            py="16px"
            bg="white"
            borderWidth="1px"
            borderColor="#E5E8EE"
            rounded="16px"
            color="#5A6478"
            fontSize="13px"
            lineHeight="19.5px"
            textAlign="center"
          >
            {t("Wallet.withdraw.destination.empty")}
          </Text>
        )}

        <Link
          asChild
          justifyContent="center"
          gap="8px"
          h="40px"
          borderWidth="2px"
          borderStyle="dashed"
          borderColor="#C4CDD8"
          rounded="16px"
          color="#8A9AB5"
          fontSize="14px"
          fontWeight={500}
          lineHeight="21px"
          _hover={{ textDecoration: "none", borderColor: "#A0ABB8" }}
        >
          <NextLink href={addHref}>
            <Text as="span" fontSize="18px" lineHeight="27px" aria-hidden>
              +
            </Text>
            {t("Wallet.withdraw.destination.add")}
          </NextLink>
        </Link>
      </Stack>

      <Flex
        align="flex-start"
        gap="10px"
        px="16px"
        py="12px"
        bg="#FFFBEB"
        borderWidth="1px"
        borderColor="#FDE68A"
        rounded="14px"
      >
        <Icon
          as={LuCircleAlert}
          boxSize="14px"
          mt="2px"
          color="#D97706"
          flexShrink={0}
        />
        <Text color="#92400E" fontSize="12px" lineHeight="18px">
          {t("Wallet.withdraw.destination.hint")}
        </Text>
      </Flex>

      <WithdrawStepActions
        onBack={onBack}
        nextLabel={t("Wallet.withdraw.nav.next")}
        onNext={onNext}
        nextDisabled={!selectedId}
      />
    </Stack>
  );
}
