"use client";

import {
  Button,
  Flex,
  Icon,
  IconButton,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuEye, LuEyeOff, LuLockKeyhole } from "react-icons/lu";

import WithdrawStepHeading from "@/components/WithdrawStepHeading";

import { WithdrawPinStepProps } from "./interface";

const CODE_LENGTH = 6;

/**
 * Etapa "Confirmação" do saque (Figma 2215-27982): o código de 6 dígitos do
 * app autenticador (TOTP), exigido para sacar (RN-PAG-04).
 */
export function WithdrawPinStep({
  netAmount,
  isSubmitting,
  error = null,
  onBack,
  onAuthorize,
}: WithdrawPinStepProps) {
  const { t } = useTranslation();
  const [code, setCode] = React.useState("");
  const [isVisible, setVisible] = React.useState(false);
  const isComplete = code.length === CODE_LENGTH;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (isComplete && !isSubmitting) onAuthorize(code);
  };

  return (
    <Stack asChild gap="24px">
      <form noValidate onSubmit={submit}>
        <WithdrawStepHeading
          icon={LuLockKeyhole}
          tone="identity"
          title={t("Wallet.withdraw.pin.title")}
          subtitle={t("Wallet.withdraw.pin.subtitle")}
        />

        <Stack gap="8px">
          <Text
            asChild
            color="#0F1729"
            fontSize="13px"
            fontWeight={700}
            lineHeight="19.5px"
          >
            <label htmlFor="withdraw-totp">
              {t("Wallet.withdraw.pin.label")}
            </label>
          </Text>
          <Flex position="relative" align="center">
            <Input
              id="withdraw-totp"
              type={isVisible ? "text" : "password"}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={CODE_LENGTH}
              placeholder="······"
              value={code}
              onChange={(event) =>
                setCode(
                  event.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH),
                )
              }
              aria-invalid={!!error}
              aria-describedby="withdraw-totp-helper"
              h="78px"
              px="56px"
              bg="white"
              borderWidth="2px"
              borderColor={error ? "#FECACA" : "#E5E8EE"}
              rounded="16px"
              color="#0F1729"
              fontSize="28px"
              fontWeight={800}
              letterSpacing="12px"
              textAlign="center"
              _placeholder={{ color: "rgba(10,10,10,0.5)" }}
              _focusVisible={{ borderColor: "#1F5AFF", outline: "none" }}
            />
            <IconButton
              position="absolute"
              right="16px"
              variant="plain"
              size="xs"
              minW="auto"
              color="#A0ABB8"
              aria-label={t(
                isVisible
                  ? "Wallet.withdraw.pin.hide"
                  : "Wallet.withdraw.pin.show",
              )}
              onClick={() => setVisible((visible) => !visible)}
            >
              <Icon as={isVisible ? LuEyeOff : LuEye} boxSize="18px" />
            </IconButton>
          </Flex>
          <Text
            id="withdraw-totp-helper"
            color="#A0ABB8"
            fontSize="12px"
            lineHeight="18px"
            textAlign="center"
          >
            {t("Wallet.withdraw.pin.helper")}
          </Text>
          {error && (
            <Text
              role="alert"
              color="#EF4444"
              fontSize="12px"
              lineHeight="18px"
              textAlign="center"
            >
              {error}
            </Text>
          )}
        </Stack>

        <Flex
          align="center"
          justify="space-between"
          gap="16px"
          px="20px"
          py="14px"
          bg="white"
          borderWidth="1px"
          borderColor="#E5E8EE"
          rounded="14px"
        >
          <Text color="#8A9AB5" fontSize="12px" lineHeight="18px">
            {t("Wallet.withdraw.pin.toReceive")}
          </Text>
          <Text
            color="#10B981"
            fontSize="18px"
            fontWeight={800}
            lineHeight="27px"
          >
            {netAmount}
          </Text>
        </Flex>

        <Stack gap="8px">
          <Button
            type="submit"
            h="41px"
            gap="8px"
            bg="#1F5AFF"
            rounded="16px"
            color="white"
            fontSize="16px"
            fontWeight={700}
            boxShadow="0px 1px 1.5px rgba(0,0,0,0.1), 0px 1px 1px rgba(0,0,0,0.1)"
            _hover={{ bg: "#1A4FE0" }}
            disabled={!isComplete}
            loading={isSubmitting}
          >
            <Icon as={LuLockKeyhole} boxSize="16px" />
            {t("Wallet.withdraw.pin.authorize")}
          </Button>
          <Button
            type="button"
            variant="plain"
            color="#8A9AB5"
            fontSize="13px"
            fontWeight={500}
            disabled={isSubmitting}
            onClick={onBack}
          >
            {t("Wallet.withdraw.nav.back")}
          </Button>
        </Stack>
      </form>
    </Stack>
  );
}
