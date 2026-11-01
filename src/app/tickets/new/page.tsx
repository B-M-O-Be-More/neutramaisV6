"use client";

import { Flex, Icon, Link, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { useTranslation } from "react-i18next";
import { LuChevronLeft, LuMessageSquare } from "react-icons/lu";

import FormSupportTicket from "@/components/Forms/FormSupportTicket";
import AuthenticatedLayout from "@/components/Layouts/Authenticated";
import { currencyLocale } from "@/functions/currencyLocale";
import {
  type NewTicketInput,
  supportTicketsService,
  SupportTicketsUnavailableError,
} from "@/services/supportTickets.service";

async function createTicket(input: NewTicketInput): Promise<string | null> {
  try {
    await supportTicketsService.create(input);
    return null;
  } catch (error) {
    return error instanceof SupportTicketsUnavailableError
      ? "TicketNew.errors.unavailable"
      : "TicketNew.errors.failed";
  }
}

function NewTicketContent() {
  const { t, i18n } = useTranslation();
  const locale = currencyLocale(i18n.language);

  return (
    <Stack
      w="full"
      maxW="760px"
      mx="auto"
      px={{ base: 4, md: "32px" }}
      py={{ base: 6, md: "28px" }}
      gap="24px"
    >
      <Flex
        as="nav"
        aria-label={t("TicketNew.breadcrumb")}
        align="center"
        gap="10px"
        fontSize="14px"
        lineHeight="21px"
      >
        <Link
          asChild
          display="flex"
          alignItems="center"
          gap="6px"
          color="#8A9AB5"
          _hover={{ color: "#5A6478", textDecoration: "none" }}
        >
          <NextLink href="/tickets">
            <Icon as={LuChevronLeft} boxSize="15px" aria-hidden />
            {t("TicketNew.back")}
          </NextLink>
        </Link>
        <Text as="span" color="#C4CDD8" aria-hidden>
          /
        </Text>
        <Text as="span" color="#0F1729" fontWeight={600} aria-current="page">
          {t("TicketNew.heading")}
        </Text>
      </Flex>

      <Stack align="center" gap="8px" textAlign="center">
        <Flex
          align="center"
          justify="center"
          boxSize="48px"
          bg="#F3EEFF"
          borderWidth="1px"
          borderColor="#E4D9FF"
          rounded="14px"
        >
          <Icon as={LuMessageSquare} boxSize="20px" color="#8B5CF6" />
        </Flex>
        <Text
          as="h1"
          color="#0F1729"
          fontSize="22px"
          fontWeight={800}
          lineHeight="33px"
        >
          {t("TicketNew.pageTitle")}
        </Text>
        <Text color="#8A9AB5" fontSize="13px" lineHeight="19.5px">
          {t("TicketNew.subtitle")}
        </Text>
      </Stack>

      <FormSupportTicket locale={locale} onSubmit={createTicket} />
    </Stack>
  );
}

// Abrir ticket de suporte (Figma 3100-50362). A API de suporte ainda não
// existe: o envio avisa que o recurso está indisponível.
export default function NewTicketPage() {
  return (
    <AuthenticatedLayout>
      <NewTicketContent />
    </AuthenticatedLayout>
  );
}
