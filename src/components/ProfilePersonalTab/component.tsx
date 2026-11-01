"use client";

import {
  Button,
  Flex,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { LuBuilding2, LuMail, LuPhone, LuUser } from "react-icons/lu";

import ProfileCard from "@/components/ProfileCard";
import ProfileField from "@/components/ProfileField";
import { memberSince } from "@/functions/profile";
import {
  BIO_MAX_LENGTH,
  profilePersonalSchema,
  type ProfilePersonalValues,
} from "@/schemas/profile";

import { ProfilePersonalTabProps } from "./interface";

function InfoRow({
  label,
  value,
  isLast = false,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <Flex
      justify="space-between"
      gap="16px"
      py="10px"
      borderBottomWidth={isLast ? 0 : "1px"}
      borderColor="#F4F6F9"
    >
      <Text as="dt" color="#8A9AB5" fontSize="12px" lineHeight="18px">
        {label}
      </Text>
      <Text
        as="dd"
        color="#0F1729"
        fontSize="13px"
        fontWeight={600}
        lineHeight="19.5px"
        textAlign="right"
      >
        {value}
      </Text>
    </Flex>
  );
}

/**
 * Aba "Dados pessoais" (Figma 2205-18339; edição: 2943-27630): informações
 * pessoais, biografia e identificação. Nome, e-mail, telefone (mascarado) e
 * data de cadastro vêm do `GET /me`; CPF, organização e CNPJ ainda não.
 */
export function ProfilePersonalTab({
  profile,
  jobTitle,
  locale,
  isEditing,
  onCancelEdit,
  onSave,
}: ProfilePersonalTabProps) {
  const { t } = useTranslation();
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const tError = (message?: string) => (message ? t(message) : undefined);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfilePersonalValues>({
    resolver: yupResolver(profilePersonalSchema),
    defaultValues: {
      displayName: profile.display_name,
      phone: "",
      jobTitle,
      bio: "",
    },
  });

  const cancel = () => {
    reset();
    setSaveError(null);
    onCancelEdit();
  };

  const submit = handleSubmit(async (values) => {
    setSaveError(null);
    const error = await onSave(values);
    if (error) setSaveError(error);
  });

  const unknown = t("Profile.unknown");

  const personal = (
    <ProfileCard title={t("Profile.personal.title")}>
      <Stack gap="16px">
        <Controller
          control={control}
          name="displayName"
          render={({ field }) => (
            <ProfileField
              id="profile-name"
              label={t("Profile.personal.fields.name")}
              icon={LuUser}
              value={isEditing ? field.value : profile.display_name}
              onChange={isEditing ? field.onChange : undefined}
              maxLength={120}
              error={tError(errors.displayName?.message)}
            />
          )}
        />
        <ProfileField
          id="profile-email"
          label={t("Profile.personal.fields.email")}
          icon={LuMail}
          type="email"
          value={profile.email}
        />
        <Controller
          control={control}
          name="phone"
          render={({ field }) => (
            <ProfileField
              id="profile-phone"
              label={t("Profile.personal.fields.phone")}
              icon={LuPhone}
              type="tel"
              // O /me só devolve os 4 últimos dígitos: editar pede o número
              // inteiro de novo.
              value={isEditing ? field.value : (profile.phone ?? unknown)}
              onChange={isEditing ? field.onChange : undefined}
              maxLength={20}
              error={tError(errors.phone?.message)}
            />
          )}
        />
        <Controller
          control={control}
          name="jobTitle"
          render={({ field }) => (
            <ProfileField
              id="profile-job-title"
              label={t("Profile.personal.fields.jobTitle")}
              icon={LuBuilding2}
              value={isEditing ? field.value : jobTitle || unknown}
              onChange={isEditing ? field.onChange : undefined}
              maxLength={80}
              error={tError(errors.jobTitle?.message)}
            />
          )}
        />
      </Stack>
    </ProfileCard>
  );

  return (
    <Stack asChild gap="20px">
      <form noValidate onSubmit={submit}>
        <SimpleGrid columns={{ base: 1, lg: 2 }} gap="20px" alignItems="start">
          {personal}
          <Stack gap="20px">
            <ProfileCard title={t("Profile.personal.bio")}>
              {isEditing ? (
                <Controller
                  control={control}
                  name="bio"
                  render={({ field }) => (
                    <Stack gap="4px">
                      <Textarea
                        aria-label={t("Profile.personal.bio")}
                        value={field.value}
                        onChange={field.onChange}
                        maxLength={BIO_MAX_LENGTH}
                        placeholder={t("Profile.personal.bioPlaceholder")}
                        h="88px"
                        p="12px"
                        borderWidth="1px"
                        borderColor="#E5E8EE"
                        rounded="10px"
                        color="#5A6478"
                        fontSize="13px"
                        lineHeight="21px"
                        resize="none"
                      />
                      <Text
                        alignSelf="flex-end"
                        color="#A0ABB8"
                        fontSize="10px"
                        lineHeight="15px"
                      >
                        {field.value.length}/{BIO_MAX_LENGTH}
                      </Text>
                    </Stack>
                  )}
                />
              ) : (
                <Text color="#A0ABB8" fontSize="13px" lineHeight="21px">
                  {t("Profile.personal.bioEmpty")}
                </Text>
              )}
            </ProfileCard>

            <ProfileCard title={t("Profile.personal.identification")}>
              <Stack as="dl" gap="0">
                <InfoRow label={t("Profile.personal.cpf")} value={unknown} />
                <InfoRow
                  label={t("Profile.personal.organization")}
                  value={unknown}
                />
                <InfoRow label={t("Profile.personal.cnpj")} value={unknown} />
                <InfoRow
                  label={t("Profile.personal.memberSince")}
                  value={memberSince(profile.created_at, locale) || unknown}
                  isLast
                />
              </Stack>
            </ProfileCard>
          </Stack>
        </SimpleGrid>

        {isEditing && (
          <Flex
            direction={{ base: "column", sm: "row" }}
            align={{ base: "stretch", sm: "center" }}
            justify="flex-end"
            gap="12px"
          >
            {saveError && (
              <Text
                role="alert"
                flex="1"
                color="#EF4444"
                fontSize="12px"
                lineHeight="18px"
              >
                {t(saveError)}
              </Text>
            )}
            <Button
              type="button"
              variant="outline"
              h="40px"
              px="20px"
              borderColor="#E5E8EE"
              rounded="14px"
              color="#5A6478"
              fontSize="13px"
              fontWeight={600}
              onClick={cancel}
            >
              {t("Profile.actions.cancel")}
            </Button>
            <Button
              type="submit"
              h="40px"
              px="20px"
              bg="#1F5AFF"
              rounded="14px"
              color="white"
              fontSize="13px"
              fontWeight={700}
              _hover={{ bg: "#1A4FE0" }}
              loading={isSubmitting}
            >
              {t("Profile.actions.save")}
            </Button>
          </Flex>
        )}
      </form>
    </Stack>
  );
}
