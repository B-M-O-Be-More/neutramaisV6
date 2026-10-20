"use client";

import { Button, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { LuCircleAlert, LuCircleCheck, LuMail, LuSend } from "react-icons/lu";

import Input from "@/components/FormControl/Input";
import Select from "@/components/FormControl/Select";
import { platformInviteSchema } from "@/schemas/platformInvite";
import { PLATFORM_ROLES } from "@/services/platformInvites.service";

import { FormPlatformInviteProps, PlatformInviteValues } from "./interface";

/**
 * Convite de um operador da plataforma: e-mail + papel. O convidado recebe um
 * link por e-mail e conclui o cadastro em `/platform-invites/accept`.
 */
export function FormPlatformInvite({
  onSubmit,
  isSubmitting = false,
  formError,
  sentTo,
}: FormPlatformInviteProps) {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PlatformInviteValues>({
    resolver: yupResolver(platformInviteSchema),
    mode: "onBlur",
    defaultValues: { email: "" },
  });

  // Mensagens do schema são chaves de tradução — traduz na exibição.
  const tError = (message?: string) => (message ? t(message) : undefined);

  const submit = handleSubmit(async (values) => {
    const ok = await onSubmit(values);
    if (ok) reset({ email: "" });
  });

  // noValidate: a validação é do yup — sem ele, o `required` nativo do select
  // barraria o envio com o balão do navegador antes das nossas mensagens.
  return (
    <Stack asChild gap="16px">
      <form onSubmit={submit} noValidate>
        <Stack
          direction={{ base: "column", md: "row" }}
          gap="16px"
          align={{ md: "flex-start" }}
        >
          <Stack flex="1" minW={0}>
            <Input
              label={t("PlatformInvite.fields.email.label")}
              required
              type="email"
              autoComplete="off"
              placeholder={t("PlatformInvite.fields.email.placeholder")}
              error={tError(errors.email?.message)}
              startElement={<Icon as={LuMail} boxSize="14px" color="#A0ABB8" />}
              {...register("email")}
            />
          </Stack>

          <Stack w={{ base: "full", md: "240px" }} flexShrink={0}>
            <Select
              label={t("PlatformInvite.fields.role.label")}
              required
              placeholder={t("PlatformInvite.fields.role.placeholder")}
              error={tError(errors.targetRole?.message)}
              {...register("targetRole")}
            >
              {PLATFORM_ROLES.map((role) => (
                <option key={role} value={role}>
                  {t(`PlatformInvite.roles.${role}`)}
                </option>
              ))}
            </Select>
          </Stack>
        </Stack>

        {formError && (
          <Flex
            align="flex-start"
            gap="8px"
            px="14px"
            py="10px"
            rounded="10px"
            bg="#FEF2F2"
            borderWidth="1px"
            borderColor="#FECACA"
            role="alert"
          >
            <Icon
              as={LuCircleAlert}
              boxSize="14px"
              color="#EF4444"
              mt="2px"
              flexShrink={0}
            />
            <Text fontSize="12.5px" lineHeight="19px" color="#991B1B">
              {t(formError)}
            </Text>
          </Flex>
        )}

        {sentTo && !formError && (
          <Flex
            align="flex-start"
            gap="8px"
            px="14px"
            py="10px"
            rounded="10px"
            bg="#EDFBF5"
            borderWidth="1px"
            borderColor="#AAECD5"
            role="status"
          >
            <Icon
              as={LuCircleCheck}
              boxSize="14px"
              color="#10B981"
              mt="2px"
              flexShrink={0}
            />
            <Text fontSize="12.5px" lineHeight="19px" color="#065F46">
              {t("PlatformInvite.sent", { email: sentTo })}
            </Text>
          </Flex>
        )}

        <Button
          type="submit"
          alignSelf={{ base: "stretch", md: "flex-end" }}
          loading={isSubmitting}
          h="42px"
          px="18px"
          gap="8px"
          rounded="12px"
          bg="#1F5AFF"
          color="white"
          fontSize="13.5px"
          fontWeight={700}
          _hover={{ bg: "brand.600" }}
        >
          <Icon as={LuSend} boxSize="14px" />
          {t("PlatformInvite.submit")}
        </Button>
      </form>
    </Stack>
  );
}
