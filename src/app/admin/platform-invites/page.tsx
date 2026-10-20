"use client";

import { Flex, Icon, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuShieldCheck, LuUserPlus } from "react-icons/lu";

import FormPlatformInvite from "@/components/Forms/FormPlatformInvite";
import AuthenticatedLayout from "@/components/Layouts/Authenticated";
import { useInvitePlatformOperator } from "@/hooks/useInvitePlatformOperator";

function PlatformInvitesContent() {
  const { t } = useTranslation();
  const { invite, isSubmitting, formError, sentTo } =
    useInvitePlatformOperator();

  return (
    <Stack
      maxW="960px"
      px={{ base: 4, md: "32px" }}
      py={{ base: 6, md: "32px" }}
      gap="24px"
    >
      <Stack gap="4px">
        <Text
          as="h1"
          color="#0F1729"
          fontSize="24px"
          fontWeight={800}
          lineHeight="34px"
        >
          {t("PlatformInvite.title")}
        </Text>
        <Text color="#8A9AB5" fontSize="13px" lineHeight="20px">
          {t("PlatformInvite.subtitle")}
        </Text>
      </Stack>

      <Stack
        gap="20px"
        p={{ base: "16px", md: "24px" }}
        bg="white"
        borderWidth="1px"
        borderColor="#E5E8EE"
        rounded="14px"
      >
        <Flex align="center" gap="12px">
          <Flex
            boxSize="40px"
            align="center"
            justify="center"
            rounded="14px"
            bg="#FFFBEB"
            borderWidth="1px"
            borderColor="#FDE68A"
            flexShrink={0}
          >
            <Icon as={LuUserPlus} boxSize="16px" color="#D97706" />
          </Flex>
          <Stack gap={0} minW={0}>
            <Text
              as="h2"
              color="#0F1729"
              fontSize="15px"
              fontWeight={700}
              lineHeight="22px"
            >
              {t("PlatformInvite.form.title")}
            </Text>
            <Text color="#8A9AB5" fontSize="12px" lineHeight="18px">
              {t("PlatformInvite.form.subtitle")}
            </Text>
          </Stack>
        </Flex>

        <FormPlatformInvite
          onSubmit={invite}
          isSubmitting={isSubmitting}
          formError={formError}
          sentTo={sentTo}
        />
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
          as={LuShieldCheck}
          boxSize="14px"
          color="#D97706"
          mt="2px"
          flexShrink={0}
        />
        <Text color="#92400E" fontSize="12px" lineHeight="18px">
          {t("PlatformInvite.notice")}
        </Text>
      </Flex>
    </Stack>
  );
}

// Convite de operadores da plataforma (super_admin + MFA). O convidado conclui
// o cadastro pelo link do e-mail, em /platform-invites/accept.
export default function PlatformInvitesPage() {
  return (
    <AuthenticatedLayout>
      <PlatformInvitesContent />
    </AuthenticatedLayout>
  );
}
