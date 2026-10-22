"use client";

import { Button, Flex, Icon, Spinner, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import type { IconType } from "react-icons";
import { LuCircleCheck, LuCircleX, LuUserRound } from "react-icons/lu";

import FormAcceptInvite from "@/components/Forms/FormAcceptInvite";
import Login from "@/components/Login";
import MfaEnrollmentFlow from "@/components/MfaEnrollmentFlow";
import { useAcceptInvite } from "@/hooks/useAcceptInvite";

const TONES = {
  success: {
    icon: LuCircleCheck,
    fg: "#10B981",
    bg: "#EDFBF5",
    border: "#10B981",
  },
  error: { icon: LuCircleX, fg: "#EF4444", bg: "#FEF2F2", border: "#FECACA" },
  info: { icon: LuUserRound, fg: "#1F5AFF", bg: "#EEF3FF", border: "#C7D8FF" },
} satisfies Record<
  string,
  { icon: IconType; fg: string; bg: string; border: string }
>;

const ctaProps = {
  w: "full",
  bg: "#1F5AFF",
  color: "white",
  rounded: "14px",
  py: "14px",
  h: "auto",
  fontSize: "15px",
  fontWeight: 700,
  lineHeight: "22.5px",
  _hover: { bg: "brand.600" },
} as const;

interface ResultProps {
  tone: keyof typeof TONES;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}

function Result({ tone, title, subtitle, action }: ResultProps) {
  const style = TONES[tone];
  return (
    <Stack w="full" maxW="420px" align="center" textAlign="center" gap={5}>
      <Flex
        align="center"
        justify="center"
        boxSize="64px"
        rounded="full"
        flexShrink={0}
        bg={style.bg}
        borderWidth="2px"
        borderColor={style.border}
      >
        <Icon as={style.icon} boxSize="28px" color={style.fg} />
      </Flex>

      <Stack gap={1}>
        <Text
          as="h1"
          fontSize="22px"
          fontWeight={800}
          lineHeight="33px"
          color="#0F1729"
        >
          {title}
        </Text>
        <Text fontSize="14px" lineHeight="21px" color="#8A9AB5">
          {subtitle}
        </Text>
      </Stack>

      {action}
    </Stack>
  );
}

/**
 * Tela de aceite de convite (`/accept/#token=...`, NEU-563), comum a
 * convites de organização e de administradores: cria a conta e segue o
 * `next_step` do Identity — área autenticada, cadastro do MFA, login, ou
 * login para resgatar o convite com uma conta existente.
 */
export function AcceptInvite() {
  const { t } = useTranslation();
  const invite = useAcceptInvite();
  const { status } = invite;

  // O token só é lido no browser; até lá não há o que mostrar.
  if (status === "checking") return null;

  if (status === "form") {
    return (
      <FormAcceptInvite
        onSubmit={invite.submit}
        isSubmitting={invite.isSubmitting}
        formError={invite.formError}
        fieldError={invite.fieldError}
      />
    );
  }

  if (status === "mfaEnrollment") {
    return <MfaEnrollmentFlow enrollment={invite.enrollment} />;
  }

  // Conta existente: login aqui mesmo, com o token ainda em memória.
  if (status === "login") {
    return <Login onAuthenticated={invite.redeem} />;
  }

  if (status === "entering") {
    return (
      <Stack align="center" gap={3} py="40px">
        <Spinner color="#1F5AFF" size="lg" />
        <Text fontSize="14px" color="#8A9AB5">
          {t("PlatformInvite.accept.entering")}
        </Text>
      </Stack>
    );
  }

  const toLogin = (
    <Button asChild {...ctaProps}>
      <Link href="/login">{t("PlatformInvite.accept.success.cta")}</Link>
    </Button>
  );

  if (status === "created") {
    const key =
      invite.created === "mfaLink"
        ? "mfaLink"
        : invite.created === "mfaPending"
          ? "mfaPending"
          : "success";
    return (
      <Result
        tone="success"
        title={t(`PlatformInvite.accept.${key}.title`)}
        subtitle={t(`PlatformInvite.accept.${key}.subtitle`)}
        action={toLogin}
      />
    );
  }

  if (status === "existingAccount") {
    return (
      <Result
        tone="info"
        title={t("PlatformInvite.accept.existing.title")}
        subtitle={t("PlatformInvite.accept.existing.subtitle")}
        action={
          <Button {...ctaProps} onClick={invite.startLogin}>
            {t("PlatformInvite.accept.existing.cta")}
          </Button>
        }
      />
    );
  }

  if (status === "redeemConflict") {
    return (
      <Result
        tone="error"
        title={t("PlatformInvite.accept.redeemConflict.title")}
        subtitle={t("PlatformInvite.accept.redeemConflict.subtitle")}
      />
    );
  }

  return (
    <Result
      tone="error"
      title={t("PlatformInvite.accept.error.title")}
      subtitle={t(
        status === "missing"
          ? "PlatformInvite.accept.error.missing"
          : "PlatformInvite.accept.error.subtitle",
      )}
    />
  );
}
