"use client";

import { Box, Flex, Icon, Link, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuShield } from "react-icons/lu";

import WithdrawAmountStep from "@/components/WithdrawAmountStep";
import WithdrawDestinationStep from "@/components/WithdrawDestinationStep";
import WithdrawPinStep from "@/components/WithdrawPinStep";
import WithdrawProcessing from "@/components/WithdrawProcessing";
import WithdrawReceipt from "@/components/WithdrawReceipt";
import WithdrawReviewStep from "@/components/WithdrawReviewStep";
import WithdrawStepper from "@/components/WithdrawStepper";
import { formatMinorAmount } from "@/functions/walletTransactions";
import { withdrawalBreakdown } from "@/functions/withdrawal";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { AuthError, ForbiddenError, ValidationError } from "@/services/errors";
import type { WalletCurrency } from "@/services/wallet.service";
import {
  withdrawalService,
  WithdrawalUnavailableError,
  type WithdrawalMode,
  type WithdrawalReceipt,
} from "@/services/withdrawal.service";

import { SellerWithdrawProps } from "./interface";

type Step = "amount" | "destination" | "review" | "pin" | "processing" | "done";

// Posição de cada etapa no indicador (Valor, Destino, Revisão, Confirmação).
const STEP_INDEX: Record<Step, number> = {
  amount: 0,
  destination: 1,
  review: 2,
  pin: 3,
  processing: 3,
  done: 3,
};

function authorizationError(error: unknown): string {
  if (error instanceof WithdrawalUnavailableError) {
    return "Wallet.withdraw.pin.errors.unavailable";
  }
  if (error instanceof AuthError || error instanceof ValidationError) {
    return "Wallet.withdraw.pin.errors.invalidCode";
  }
  if (error instanceof ForbiddenError) {
    return "Wallet.withdraw.pin.errors.forbidden";
  }
  return "Wallet.withdraw.pin.errors.failed";
}

/**
 * Solicitar saque do seller (Figma 2215-23978 a 2215-29463): valor e
 * modalidade, destino, revisão, PIN do autenticador, processamento e
 * comprovante. O saldo vem da wallet-api; o envio usa `request`.
 */
export function SellerWithdraw({
  accounts,
  walletHref,
  addAccountHref,
  locale,
  request = withdrawalService.request,
}: SellerWithdrawProps) {
  const { t } = useTranslation();
  const balance = useWalletBalance();
  const [step, setStep] = React.useState<Step>("amount");
  const [amountMinor, setAmountMinor] = React.useState(0);
  const [mode, setMode] = React.useState<WithdrawalMode>("normal");
  const [accountId, setAccountId] = React.useState<string | null>(
    () =>
      accounts.find((item) => item.isDefault && item.status === "active")?.id ??
      null,
  );
  const [error, setError] = React.useState<string | null>(null);
  const [receipt, setReceipt] = React.useState<WithdrawalReceipt | null>(null);

  const currency = balance.balance?.currency ?? "BRL";
  const money = (minor: number) =>
    formatMinorAmount(minor, currency as WalletCurrency, locale);
  const breakdown = withdrawalBreakdown(amountMinor, mode);
  const account = accounts.find((item) => item.id === accountId) ?? null;

  const authorize = (totp: string) => {
    if (!accountId) return;
    setError(null);
    setStep("processing");
    request({ amountMinor, currency, mode, accountId, totp })
      .then((result) => {
        setReceipt(result);
        setStep("done");
      })
      .catch((reason) => {
        setError(t(authorizationError(reason)));
        setStep("pin");
      });
  };

  let content: React.ReactNode;
  if (step === "amount") {
    content = (
      <WithdrawAmountStep
        availableMinor={balance.balance?.availableMinor ?? null}
        isLoadingBalance={balance.isLoading}
        balanceError={balance.error ? t(balance.error) : null}
        currency={currency}
        locale={locale}
        amountMinor={amountMinor}
        mode={mode}
        onAmountChange={setAmountMinor}
        onModeChange={setMode}
        onNext={() => setStep("destination")}
      />
    );
  } else if (step === "destination") {
    content = (
      <WithdrawDestinationStep
        accounts={accounts}
        selectedId={accountId}
        onSelect={setAccountId}
        addHref={addAccountHref}
        onBack={() => setStep("amount")}
        onNext={() => setStep("review")}
      />
    );
  } else if (step === "review" && account) {
    content = (
      <WithdrawReviewStep
        breakdown={breakdown}
        mode={mode}
        account={account}
        currency={currency}
        locale={locale}
        onBack={() => setStep("destination")}
        onConfirm={() => {
          setError(null);
          setStep("pin");
        }}
      />
    );
  } else if (step === "pin") {
    content = (
      <WithdrawPinStep
        netAmount={money(breakdown.netMinor)}
        isSubmitting={false}
        error={error}
        onBack={() => setStep("review")}
        onAuthorize={authorize}
      />
    );
  } else if (step === "processing") {
    content = <WithdrawProcessing />;
  } else if (step === "done" && receipt && account) {
    content = (
      <WithdrawReceipt
        protocol={receipt.protocol}
        netAmount={money(breakdown.netMinor)}
        account={account}
        mode={mode}
        walletHref={walletHref}
      />
    );
  }

  return (
    <Stack gap="0" minH="100dvh" bg="#F8F9FB">
      <Flex
        as="header"
        align="center"
        gap="16px"
        px={{ base: 4, md: "32px" }}
        py="16px"
        bg="white"
        borderBottomWidth="1px"
        borderColor="#E5E8EE"
      >
        <Link
          asChild
          color="#8A9AB5"
          fontSize="16px"
          fontWeight={500}
          lineHeight="24px"
        >
          <NextLink href={walletHref}>
            {t("Wallet.withdraw.header.back")}
          </NextLink>
        </Link>
        <Box w="1px" h="20px" bg="#E5E8EE" aria-hidden />
        <Text
          color="#0F1729"
          fontSize="15px"
          fontWeight={700}
          lineHeight="22.5px"
        >
          {t("Wallet.withdraw.header.title")}
        </Text>
        <Flex flex="1" justify="flex-end" align="center" gap="8px">
          <Icon as={LuShield} boxSize="14px" color="#10B981" />
          <Text
            color="#10B981"
            fontSize="12px"
            fontWeight={600}
            lineHeight="18px"
            display={{ base: "none", sm: "block" }}
          >
            {t("Wallet.withdraw.header.protected")}
          </Text>
        </Flex>
      </Flex>

      <Box
        px={{ base: 4, md: "32px" }}
        py="12px"
        bg="white"
        borderBottomWidth="1px"
        borderColor="#F4F6F9"
      >
        <WithdrawStepper
          current={STEP_INDEX[step]}
          isComplete={step === "done"}
        />
      </Box>

      <Box w="full" maxW="512px" mx="auto" px="16px" py="40px">
        {content}
      </Box>
    </Stack>
  );
}
