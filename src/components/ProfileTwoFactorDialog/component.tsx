"use client";

import {
  Box,
  Button,
  chakra,
  Checkbox,
  Dialog,
  Flex,
  Icon,
  Input,
  Portal,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import type { IconType } from "react-icons";
import { LuMail, LuQrCode, LuShield, LuSmartphone } from "react-icons/lu";
import QRCode from "react-qr-code";

import { manualKeyGroups } from "@/functions/manualKeyGroups";
import { otpauthSecret } from "@/functions/profile";
import {
  AuthError,
  ConflictError,
  ForbiddenError,
  RateLimitError,
} from "@/services/errors";
import { myMfaService, type MyMfaEnrollment } from "@/services/myMfa.service";

import { ProfileTwoFactorDialogProps } from "./interface";

type Step = "method" | "password" | "qr" | "codes" | "code";

const CODE_PATTERN = /^\d{6}$/;

const METHODS: { key: string; icon: IconType; available: boolean }[] = [
  { key: "totp", icon: LuQrCode, available: true },
  { key: "email", icon: LuMail, available: false },
  { key: "sms", icon: LuSmartphone, available: false },
];

function errorKey(error: unknown, mode: "enable" | "disable"): string {
  if (error instanceof ForbiddenError) return "wrongPassword";
  if (error instanceof AuthError) {
    return mode === "disable" ? "wrongPasswordOrCode" : "invalidCode";
  }
  if (error instanceof ConflictError) {
    return mode === "disable" ? "requiredByRole" : "alreadyEnrolled";
  }
  if (error instanceof RateLimitError) return "rateLimited";
  return "failed";
}

const LABEL = {
  color: "#0F1729",
  fontSize: "13px",
  fontWeight: 700,
  lineHeight: "19.5px",
} as const;

function CodeInput({
  id,
  value,
  onChange,
  label,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <Stack gap="8px">
      <Text asChild {...LABEL}>
        <label htmlFor={id}>{label}</label>
      </Text>
      <Input
        id={id}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="000000"
        value={value}
        onChange={(event) =>
          onChange(event.target.value.replace(/\D/g, "").slice(0, 6))
        }
        h="66px"
        bg="#F8F9FB"
        borderWidth="1px"
        borderColor="#E5E8EE"
        rounded="14px"
        color="#0F1729"
        fontSize="26px"
        fontWeight={800}
        letterSpacing="12px"
        textAlign="center"
        _placeholder={{ color: "rgba(10,10,10,0.35)" }}
      />
    </Stack>
  );
}

function PasswordInput({
  id,
  value,
  onChange,
  label,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <Stack gap="8px">
      <Text asChild {...LABEL}>
        <label htmlFor={id}>{label}</label>
      </Text>
      <Input
        id={id}
        type="password"
        autoComplete="current-password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        h="42px"
        px="14px"
        bg="#F8F9FB"
        borderWidth="1px"
        borderColor="#E5E8EE"
        rounded="10px"
        fontSize="13px"
      />
    </Stack>
  );
}

/**
 * Ativar ou desativar o 2FA no Meu Perfil (Figma 2206-19563, 2206-20186,
 * 2206-20209 e 2206-20231). Só o app autenticador (TOTP) existe na
 * identity-api: e-mail e SMS aparecem indisponíveis. O cadastro pede a senha
 * atual, mostra o QR code e os códigos de recuperação e confirma com o
 * primeiro código; desativar pede senha e código.
 */
export function ProfileTwoFactorDialog({
  mode,
  email,
  phone,
  onClose,
  onChanged,
}: ProfileTwoFactorDialogProps) {
  const { t } = useTranslation();
  const [step, setStep] = React.useState<Step>("method");
  const [password, setPassword] = React.useState("");
  const [code, setCode] = React.useState("");
  const [enrollment, setEnrollment] = React.useState<MyMfaEnrollment | null>(
    null,
  );
  const [codesSaved, setCodesSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isBusy, setBusy] = React.useState(false);

  const close = () => {
    setStep("method");
    setPassword("");
    setCode("");
    setEnrollment(null);
    setCodesSaved(false);
    setError(null);
    onClose();
  };

  const run = async (action: () => Promise<void>) => {
    if (!mode) return;
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (reason) {
      setError(errorKey(reason, mode));
    } finally {
      setBusy(false);
    }
  };

  const startEnrollment = () =>
    run(async () => {
      setEnrollment(await myMfaService.enroll(password));
      setPassword("");
      setStep("qr");
    });

  const confirmEnrollment = () =>
    run(async () => {
      await myMfaService.confirm(code);
      onChanged();
      close();
    });

  const disable = () =>
    run(async () => {
      await myMfaService.disable(password, code);
      onChanged();
      close();
    });

  const secondary = (label: string, onClick: () => void) => (
    <Button
      type="button"
      variant="outline"
      flex="1"
      h="41px"
      borderColor="#E5E8EE"
      rounded="14px"
      color="#5A6478"
      fontSize="13px"
      fontWeight={500}
      disabled={isBusy}
      onClick={onClick}
    >
      {label}
    </Button>
  );

  const primary = (
    label: string,
    onClick: () => void,
    disabled = false,
    icon?: IconType,
  ) => (
    <Button
      type="button"
      flex="1"
      h="41px"
      gap="8px"
      bg="#1F5AFF"
      rounded="14px"
      color="white"
      fontSize="13px"
      fontWeight={700}
      _hover={{ bg: "#1A4FE0" }}
      _disabled={{ bg: "#C4CDD8", opacity: 1 }}
      disabled={disabled}
      loading={isBusy}
      onClick={onClick}
    >
      {icon && <Icon as={icon} boxSize="14px" />}
      {label}
    </Button>
  );

  let body: React.ReactNode;
  let actions: React.ReactNode;

  if (mode === "disable") {
    body = (
      <Stack gap="16px">
        <Text color="#8A9AB5" fontSize="13px" lineHeight="19.5px">
          {t("Profile.security.twoFactor.dialog.disableDescription")}
        </Text>
        <PasswordInput
          id="mfa-disable-password"
          label={t("Profile.security.twoFactor.dialog.password")}
          value={password}
          onChange={setPassword}
        />
        <CodeInput
          id="mfa-disable-code"
          label={t("Profile.security.twoFactor.dialog.codeApp")}
          value={code}
          onChange={setCode}
        />
      </Stack>
    );
    actions = (
      <>
        {secondary(t("Profile.actions.cancel"), close)}
        {primary(
          t("Profile.security.twoFactor.disable"),
          disable,
          !password || !CODE_PATTERN.test(code),
        )}
      </>
    );
  } else if (step === "method") {
    body = (
      <Stack gap="12px">
        <Text color="#8A9AB5" fontSize="13px" lineHeight="19.5px">
          {t("Profile.security.twoFactor.dialog.required")}
        </Text>
        <Text {...LABEL} pt="4px">
          {t("Profile.security.twoFactor.dialog.chooseMethod")}
        </Text>
        <Stack
          role="radiogroup"
          aria-label={t("Profile.security.twoFactor.dialog.chooseMethod")}
          gap="12px"
        >
          {METHODS.map((method) => (
            <chakra.button
              key={method.key}
              type="button"
              role="radio"
              aria-checked={method.available}
              disabled={!method.available}
              display="flex"
              alignItems="center"
              gap="12px"
              p="14px"
              textAlign="start"
              bg={method.available ? "white" : "#F8F9FB"}
              borderWidth="2px"
              borderColor={method.available ? "#1F5AFF" : "#E5E8EE"}
              rounded="14px"
              opacity={method.available ? 1 : 0.5}
              cursor={method.available ? "pointer" : "not-allowed"}
            >
              <Flex
                align="center"
                justify="center"
                boxSize="16px"
                flexShrink={0}
                borderWidth="1px"
                borderColor={method.available ? "#1F5AFF" : "#C4CDD8"}
                rounded="full"
              >
                {method.available && (
                  <Box boxSize="8px" rounded="full" bg="#1F5AFF" />
                )}
              </Flex>
              <Flex
                align="center"
                justify="center"
                boxSize="32px"
                flexShrink={0}
                bg="white"
                borderWidth="1px"
                borderColor="#E5E8EE"
                rounded="10px"
              >
                <Icon
                  as={method.icon}
                  boxSize="16px"
                  color={method.available ? "#10B981" : "#8A9AB5"}
                />
              </Flex>
              <Stack gap="0" minW={0}>
                <Text
                  color="#0F1729"
                  fontSize="13px"
                  fontWeight={600}
                  lineHeight="19.5px"
                >
                  {t(`Profile.security.twoFactor.methods.${method.key}.title`)}
                </Text>
                <Text
                  color="#8A9AB5"
                  fontSize="11px"
                  fontWeight={500}
                  lineHeight="16.5px"
                  truncate
                >
                  {method.key === "email"
                    ? email
                    : method.key === "sms"
                      ? (phone ?? "")
                      : t(
                          "Profile.security.twoFactor.methods.totp.description",
                        )}
                  {!method.available &&
                    ` · ${t("Profile.security.twoFactor.methods.soon")}`}
                </Text>
              </Stack>
            </chakra.button>
          ))}
        </Stack>
      </Stack>
    );
    actions = (
      <>
        {secondary(t("Profile.actions.cancel"), close)}
        {primary(t("Profile.security.twoFactor.dialog.continue"), () =>
          setStep("password"),
        )}
      </>
    );
  } else if (step === "password") {
    body = (
      <Stack gap="12px">
        <Text color="#8A9AB5" fontSize="13px" lineHeight="19.5px">
          {t("Profile.security.twoFactor.dialog.passwordDescription")}
        </Text>
        <PasswordInput
          id="mfa-enroll-password"
          label={t("Profile.security.twoFactor.dialog.password")}
          value={password}
          onChange={setPassword}
        />
      </Stack>
    );
    actions = (
      <>
        {secondary(t("Profile.actions.back"), () => setStep("method"))}
        {primary(
          t("Profile.security.twoFactor.dialog.continue"),
          startEnrollment,
          !password,
        )}
      </>
    );
  } else if (step === "qr" && enrollment) {
    const secret = otpauthSecret(enrollment.otpauth_uri);
    body = (
      <Stack gap="12px" align="center" textAlign="center">
        <Text color="#8A9AB5" fontSize="13px" lineHeight="19.5px">
          {t("Profile.security.twoFactor.dialog.scan")}
        </Text>
        <Box
          p="12px"
          bg="white"
          borderWidth="1px"
          borderColor="#E5E8EE"
          rounded="14px"
        >
          <QRCode
            value={enrollment.otpauth_uri}
            size={160}
            aria-label={t("Profile.security.twoFactor.dialog.qrLabel")}
          />
        </Box>
        {secret && (
          <Stack gap="2px">
            <Text color="#8A9AB5" fontSize="11px" lineHeight="16.5px">
              {t("Profile.security.twoFactor.dialog.manualKey")}
            </Text>
            <Text
              color="#0F1729"
              fontFamily="mono"
              fontSize="13px"
              fontWeight={600}
              userSelect="all"
            >
              {manualKeyGroups(secret)}
            </Text>
          </Stack>
        )}
      </Stack>
    );
    actions = (
      <>
        {secondary(t("Profile.actions.cancel"), close)}
        {primary(t("Profile.security.twoFactor.dialog.continue"), () =>
          setStep("codes"),
        )}
      </>
    );
  } else if (step === "codes" && enrollment) {
    body = (
      <Stack gap="12px">
        <Text color="#8A9AB5" fontSize="13px" lineHeight="19.5px">
          {t("Profile.security.twoFactor.dialog.recovery")}
        </Text>
        <SimpleGrid
          as="ul"
          columns={2}
          gap="8px"
          p="12px"
          bg="#F8F9FB"
          borderWidth="1px"
          borderColor="#E5E8EE"
          rounded="12px"
          listStyleType="none"
        >
          {enrollment.recovery_codes.map((recovery) => (
            <Text
              as="li"
              key={recovery}
              color="#0F1729"
              fontFamily="mono"
              fontSize="12px"
              textAlign="center"
            >
              {recovery}
            </Text>
          ))}
        </SimpleGrid>
        <Checkbox.Root
          checked={codesSaved}
          onCheckedChange={(event) => setCodesSaved(!!event.checked)}
          size="sm"
        >
          <Checkbox.HiddenInput />
          <Checkbox.Control />
          <Checkbox.Label color="#5A6478" fontSize="12px">
            {t("Profile.security.twoFactor.dialog.saved")}
          </Checkbox.Label>
        </Checkbox.Root>
      </Stack>
    );
    actions = (
      <>
        {secondary(t("Profile.actions.back"), () => setStep("qr"))}
        {primary(
          t("Profile.security.twoFactor.dialog.continue"),
          () => setStep("code"),
          !codesSaved,
        )}
      </>
    );
  } else {
    body = (
      <CodeInput
        id="mfa-enroll-code"
        label={t("Profile.security.twoFactor.dialog.codeApp")}
        value={code}
        onChange={setCode}
      />
    );
    actions = (
      <>
        {secondary(t("Profile.actions.back"), () => setStep("codes"))}
        {primary(
          t("Profile.security.twoFactor.dialog.confirm"),
          confirmEnrollment,
          !CODE_PATTERN.test(code),
          LuShield,
        )}
      </>
    );
  }

  return (
    <Dialog.Root
      open={mode !== null}
      onOpenChange={(details) => {
        if (!details.open && !isBusy) close();
      }}
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            maxW="600px"
            w="calc(100% - 32px)"
            p="24px"
            gap="16px"
            rounded="14px"
            borderWidth="1px"
            borderColor="#E5E8EE"
          >
            <Flex align="center" justify="space-between" gap="12px">
              <Dialog.Title
                color="#0F1729"
                fontSize="15px"
                fontWeight={700}
                lineHeight="22.5px"
              >
                {t("Profile.security.twoFactor.title")}
              </Dialog.Title>
              <Box
                px="12px"
                py="4px"
                bg={mode === "disable" ? "#EDFBF5" : "#FEF2F2"}
                borderWidth="1px"
                borderColor={mode === "disable" ? "#AAECD5" : "#FECACA"}
                rounded="10px"
                color={mode === "disable" ? "#10B981" : "#EF4444"}
                fontSize="11px"
                fontWeight={700}
                lineHeight="16.5px"
              >
                {t(
                  mode === "disable"
                    ? "Profile.security.twoFactor.active"
                    : "Profile.security.twoFactor.inactive",
                )}
              </Box>
            </Flex>

            {body}

            {error && (
              <Text
                role="alert"
                color="#EF4444"
                fontSize="12px"
                lineHeight="18px"
              >
                {t(`Profile.security.twoFactor.errors.${error}`)}
              </Text>
            )}

            <Flex gap="8px">{actions}</Flex>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
