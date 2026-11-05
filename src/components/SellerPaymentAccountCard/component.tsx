"use client";

import {
  Button,
  Field,
  Flex,
  Icon,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  LuCircleAlert,
  LuCircleCheck,
  LuCircleDashed,
  LuExternalLink,
  LuRefreshCw,
} from "react-icons/lu";

import MfaStepUpDialog from "@/components/MfaStepUpDialog";
import { usePaymentAccount } from "@/hooks/usePaymentAccount";

import { SellerPaymentAccountCardProps } from "./interface";

type AccountState = "active" | "pending" | "none";

const STATE_STYLES: Record<
  AccountState,
  { bg: string; border: string; color: string; icon: typeof LuCircleCheck }
> = {
  active: {
    bg: "#EDFBF5",
    border: "#A7F3D0",
    color: "#047857",
    icon: LuCircleCheck,
  },
  pending: {
    bg: "#FFFBEB",
    border: "#FDE68A",
    color: "#B45309",
    icon: LuCircleAlert,
  },
  none: {
    bg: "#F8F9FB",
    border: "#E5E8EE",
    color: "#5A6478",
    icon: LuCircleDashed,
  },
};

/**
 * Conta de recebimento do Seller no Stripe Connect (D-10). Sem conta ativa,
 * o checkout não aceita as ofertas da organização e não há repasse. O Dono
 * abre o formulário do Stripe por aqui e, ao voltar, a situação é lida de
 * novo; os demais papéis só veem a situação.
 */
export function SellerPaymentAccountCard({
  organizationId,
  isOwner,
  defaultEmail,
}: SellerPaymentAccountCardProps) {
  const { t } = useTranslation();
  const account = usePaymentAccount(organizationId, { isOwner });
  // Até o seller digitar, vale o e-mail do usuário (que chega com o /me).
  const [typedEmail, setEmail] = React.useState<string | null>(null);
  const email = typedEmail ?? defaultEmail;
  const emailId = React.useId();

  const { access } = account;
  const state: AccountState = access?.isOnboarded
    ? "active"
    : access?.hasAccount
      ? "pending"
      : "none";
  const style = STATE_STYLES[state];
  const isBusy = account.pendingAction !== null;

  const flags = access
    ? [
        { key: "charges", ok: access.chargesEnabled },
        { key: "payouts", ok: access.payoutsEnabled },
      ]
    : [];

  return (
    <Stack
      as="section"
      aria-labelledby="seller-payment-account-title"
      gap="14px"
      p="20px"
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="14px"
    >
      <Stack gap="2px">
        <Text
          as="h2"
          id="seller-payment-account-title"
          color="#0F1729"
          fontSize="15px"
          fontWeight={700}
          lineHeight="22.5px"
        >
          {t("SellerPaymentAccount.title")}
        </Text>
        <Text color="#8A9AB5" fontSize="12px" lineHeight="18px">
          {t("SellerPaymentAccount.subtitle")}
        </Text>
      </Stack>

      {account.isLoading ? (
        <Text color="#5A6478" fontSize="13px" role="status">
          {t("SellerPaymentAccount.loading")}
        </Text>
      ) : account.loadErrorKey ? (
        <Flex align="center" gap="12px" wrap="wrap">
          <Text color="#B91C1C" fontSize="13px" role="alert">
            {t(account.loadErrorKey)}
          </Text>
          <Button
            variant="outline"
            size="sm"
            rounded="10px"
            onClick={account.reload}
          >
            {t("SellerPaymentAccount.retry")}
          </Button>
        </Flex>
      ) : (
        <>
          <Flex
            align="flex-start"
            gap="10px"
            p="12px"
            bg={style.bg}
            borderWidth="1px"
            borderColor={style.border}
            rounded="10px"
          >
            <Icon
              as={style.icon}
              boxSize="16px"
              color={style.color}
              mt="2px"
              flexShrink={0}
            />
            <Stack gap="6px" minW={0}>
              <Text
                color={style.color}
                fontSize="13px"
                fontWeight={700}
                lineHeight="19.5px"
              >
                {t(`SellerPaymentAccount.state.${state}.title`)}
              </Text>
              <Text color="#5A6478" fontSize="12px" lineHeight="18px">
                {t(`SellerPaymentAccount.state.${state}.description`)}
              </Text>
              {state === "pending" && (
                <Flex gap="12px" wrap="wrap">
                  {flags.map((flag) => (
                    <Flex key={flag.key} align="center" gap="4px">
                      <Icon
                        as={flag.ok ? LuCircleCheck : LuCircleDashed}
                        boxSize="12px"
                        color={flag.ok ? "#047857" : "#8A9AB5"}
                      />
                      <Text color="#5A6478" fontSize="12px">
                        {t(
                          `SellerPaymentAccount.flags.${flag.key}.${flag.ok ? "on" : "off"}`,
                        )}
                      </Text>
                    </Flex>
                  ))}
                </Flex>
              )}
            </Stack>
          </Flex>

          {state !== "active" &&
            (isOwner ? (
              <Stack gap="12px">
                {state === "none" && (
                  <Field.Root>
                    <Field.Label
                      htmlFor={emailId}
                      color="#0F1729"
                      fontSize="13px"
                      fontWeight={600}
                    >
                      {t("SellerPaymentAccount.emailLabel")}
                    </Field.Label>
                    <Input
                      id={emailId}
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete="email"
                      h="40px"
                      rounded="10px"
                      fontSize="13px"
                    />
                    <Field.HelperText fontSize="12px" color="#8A9AB5">
                      {t("SellerPaymentAccount.emailHelper")}
                    </Field.HelperText>
                  </Field.Root>
                )}
                <Flex gap="8px" wrap="wrap">
                  <Button
                    h="38px"
                    gap="8px"
                    rounded="10px"
                    bg="#1F5AFF"
                    color="white"
                    fontSize="13px"
                    fontWeight={600}
                    disabled={isBusy || !email.trim()}
                    loading={account.pendingAction === "start"}
                    onClick={() => account.start(email.trim())}
                    _hover={{ bg: "#1646CC" }}
                  >
                    {t(
                      state === "none"
                        ? "SellerPaymentAccount.start"
                        : "SellerPaymentAccount.continue",
                    )}
                    <Icon as={LuExternalLink} boxSize="14px" />
                  </Button>
                  {state === "pending" && (
                    <Button
                      variant="outline"
                      h="38px"
                      gap="8px"
                      rounded="10px"
                      borderColor="#E5E8EE"
                      color="#5A6478"
                      fontSize="13px"
                      disabled={isBusy}
                      loading={account.pendingAction === "refresh"}
                      onClick={account.refresh}
                    >
                      <Icon as={LuRefreshCw} boxSize="14px" />
                      {t("SellerPaymentAccount.refresh")}
                    </Button>
                  )}
                </Flex>
                {account.actionErrorKey && (
                  <Text color="#B91C1C" fontSize="12px" role="alert">
                    {t(account.actionErrorKey)}
                  </Text>
                )}
              </Stack>
            ) : (
              <Text color="#8A9AB5" fontSize="12px" lineHeight="18px">
                {t("SellerPaymentAccount.ownerOnly")}
              </Text>
            ))}
        </>
      )}

      <MfaStepUpDialog
        open={account.needsMfa}
        reason={t("SellerPaymentAccount.mfaReason")}
        onSuccess={account.retry}
        onClose={account.dismissMfa}
      />
    </Stack>
  );
}
