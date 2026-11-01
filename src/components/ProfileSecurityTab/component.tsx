"use client";

import {
  Box,
  Button,
  Flex,
  Icon,
  IconButton,
  Input,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import NextLink from "next/link";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { LuEye, LuEyeOff, LuGlobe, LuLogOut } from "react-icons/lu";

import ProfileCard from "@/components/ProfileCard";
import ProfileTwoFactorCard from "@/components/ProfileTwoFactorCard";
import { describeUserAgent } from "@/functions/profile";
import {
  changePasswordSchema,
  type ChangePasswordValues,
} from "@/schemas/profile";

import { ProfileSecurityTabProps } from "./interface";

function PasswordField({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error?: string;
  autoComplete: string;
}) {
  const { t } = useTranslation();
  const [isVisible, setVisible] = React.useState(false);

  return (
    <Stack gap="6px">
      <Text
        asChild
        color="#5A6478"
        fontSize="12px"
        fontWeight={600}
        lineHeight="18px"
      >
        <label htmlFor={id}>{label}</label>
      </Text>
      <Box position="relative">
        <Input
          id={id}
          type={isVisible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          h="42px"
          ps="16px"
          pe="40px"
          bg="#F8F9FB"
          borderWidth="1px"
          borderColor={error ? "#FECACA" : "#E5E8EE"}
          rounded="10px"
          fontSize="13px"
        />
        <IconButton
          position="absolute"
          right="8px"
          top="50%"
          transform="translateY(-50%)"
          variant="plain"
          size="2xs"
          minW="auto"
          color="#A0ABB8"
          aria-label={t(
            isVisible
              ? "Profile.security.password.hide"
              : "Profile.security.password.show",
          )}
          onClick={() => setVisible((visible) => !visible)}
        >
          <Icon as={isVisible ? LuEyeOff : LuEye} boxSize="14px" />
        </IconButton>
      </Box>
      {error && (
        <Text
          id={`${id}-error`}
          color="#EF4444"
          fontSize="11px"
          lineHeight="16.5px"
        >
          {error}
        </Text>
      )}
    </Stack>
  );
}

function ChangePasswordCard({
  onChangePassword,
}: Pick<ProfileSecurityTabProps, "onChangePassword">) {
  const { t } = useTranslation();
  const [result, setResult] = React.useState<string | null>(null);
  const tError = (message?: string) => (message ? t(message) : undefined);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({
    resolver: yupResolver(changePasswordSchema),
    defaultValues: changePasswordSchema.getDefault(),
  });

  const submit = handleSubmit(async (values) => {
    setResult(await onChangePassword(values));
  });

  const fields = [
    ["currentPassword", "current-password"],
    ["newPassword", "new-password"],
    ["confirmPassword", "new-password"],
  ] as const;

  return (
    <ProfileCard title={t("Profile.security.password.title")}>
      <Stack asChild gap="16px">
        <form noValidate onSubmit={submit}>
          {fields.map(([name, autoComplete]) => (
            <Controller
              key={name}
              control={control}
              name={name}
              render={({ field }) => (
                <PasswordField
                  id={`profile-${name}`}
                  label={t(`Profile.security.password.${name}`)}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  autoComplete={autoComplete}
                  error={tError(errors[name]?.message)}
                />
              )}
            />
          ))}
          {result && (
            <Text
              role="alert"
              color="#EF4444"
              fontSize="12px"
              lineHeight="18px"
            >
              {t(result)}
            </Text>
          )}
          <Button
            type="submit"
            h="41px"
            bg="#1F5AFF"
            rounded="14px"
            color="white"
            fontSize="13px"
            fontWeight={700}
            _hover={{ bg: "#1A4FE0" }}
            loading={isSubmitting}
          >
            {t("Profile.security.password.submit")}
          </Button>
        </form>
      </Stack>
    </ProfileCard>
  );
}

/**
 * Aba "Segurança" (Figma 2206-20298): alterar senha, sessões, 2FA e zona de
 * perigo. O 2FA usa a identity-api; alterar a senha com a sessão aberta e
 * listar/revogar sessões ainda não têm rota — a lista mostra só a sessão
 * deste navegador. Encerrar a conta passa pelo Suporte/Compliance.
 */
export function ProfileSecurityTab({
  profile,
  locale,
  userAgent,
  onChangePassword,
  onRevokeOthers,
  closeAccountHref,
}: ProfileSecurityTabProps) {
  const { t } = useTranslation();
  const [revokeError, setRevokeError] = React.useState<string | null>(null);
  const [isRevoking, setRevoking] = React.useState(false);
  const session = describeUserAgent(userAgent);

  const revoke = async () => {
    setRevoking(true);
    setRevokeError(await onRevokeOthers());
    setRevoking(false);
  };

  return (
    <SimpleGrid columns={{ base: 1, lg: 2 }} gap="20px" alignItems="start">
      <Stack gap="20px">
        <ChangePasswordCard onChangePassword={onChangePassword} />
        <ProfileTwoFactorCard
          email={profile.email}
          phone={profile.phone}
          locale={locale}
        />
      </Stack>

      <Stack gap="20px">
        <ProfileCard title={t("Profile.security.sessions.title")}>
          <Stack gap="0" mx="-24px">
            <Flex
              align="center"
              gap="12px"
              px="24px"
              py="14px"
              borderTopWidth="1px"
              borderBottomWidth="1px"
              borderColor="#F4F6F9"
            >
              <Flex
                align="center"
                justify="center"
                boxSize="32px"
                flexShrink={0}
                bg="#EEF3FF"
                rounded="full"
              >
                <Icon as={LuGlobe} boxSize="14px" color="#1F5AFF" />
              </Flex>
              <Stack gap="0" flex="1" minW={0}>
                <Text color="#0F1729" fontSize="13px" fontWeight={700}>
                  {[session.browser, session.os].filter(Boolean).join(" · ") ||
                    t("Profile.security.sessions.thisBrowser")}
                </Text>
                <Text color="#8A9AB5" fontSize="11px" lineHeight="16.5px">
                  {t("Profile.security.sessions.now")}
                </Text>
              </Stack>
              <Box
                flexShrink={0}
                px="8px"
                py="2px"
                bg="#EDFBF5"
                rounded="8px"
                color="#10B981"
                fontSize="10px"
                fontWeight={700}
                lineHeight="15px"
              >
                {t("Profile.security.sessions.current")}
              </Box>
            </Flex>
          </Stack>
          <Text color="#A0ABB8" fontSize="11px" lineHeight="16.5px">
            {t("Profile.security.sessions.othersUnavailable")}
          </Text>
          {revokeError && (
            <Text
              role="alert"
              color="#EF4444"
              fontSize="12px"
              lineHeight="18px"
            >
              {t(revokeError)}
            </Text>
          )}
          <Button
            variant="plain"
            h="32px"
            color="#EF4444"
            fontSize="12px"
            fontWeight={600}
            loading={isRevoking}
            onClick={revoke}
          >
            {t("Profile.security.sessions.revokeOthers")}
          </Button>
        </ProfileCard>

        <ProfileCard title={t("Profile.security.danger.title")} tone="danger">
          <Text mt="-8px" color="#B91C1C" fontSize="12px" lineHeight="18px">
            {t("Profile.security.danger.description")}
          </Text>
          <Button
            asChild
            alignSelf="flex-start"
            variant="outline"
            h="34px"
            px="14px"
            gap="6px"
            bg="white"
            borderColor="#FECACA"
            rounded="10px"
            color="#EF4444"
            fontSize="12px"
            fontWeight={600}
          >
            <NextLink href={closeAccountHref}>
              <Icon as={LuLogOut} boxSize="13px" />
              {t("Profile.security.danger.closeAccount")}
            </NextLink>
          </Button>
        </ProfileCard>
      </Stack>
    </SimpleGrid>
  );
}
