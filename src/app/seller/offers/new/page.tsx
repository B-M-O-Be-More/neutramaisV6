"use client";

import { Box, Flex, Icon, Link, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuChevronLeft } from "react-icons/lu";

import FormSellerOffer, {
  type PublishedOffer,
} from "@/components/Forms/FormSellerOffer";
import AuthenticatedLayout from "@/components/Layouts/Authenticated";
import SellerOfferPublished from "@/components/SellerOfferPublished";
import {
  SellerSessionProvider,
  useSellerSession,
} from "@/contexts/SellerSessionContext";
import { currencyLocale } from "@/functions/currencyLocale";

function NewOfferContent() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { organizationId } = useSellerSession();
  // Criada, a página troca o assistente pela confirmação.
  const [published, setPublished] = React.useState<PublishedOffer | null>(null);

  return (
    <Stack
      maxW="1280px"
      px={{ base: 4, md: "32px" }}
      py={{ base: 6, md: "28px" }}
      gap="24px"
    >
      <Flex align="center" gap={published ? "16px" : "8px"}>
        <Link
          asChild
          gap="8px"
          color="#5A6478"
          fontSize="14px"
          fontWeight={500}
          lineHeight="21px"
        >
          <NextLink href="/seller/offers">
            <Icon as={LuChevronLeft} boxSize="18px" />
            {t("SellerOffers.title")}
          </NextLink>
        </Link>
        <Box w="1px" h="20px" bg="#E5E8EE" />
        <Text
          as="h1"
          color="#0F1729"
          fontSize="20px"
          fontWeight={800}
          lineHeight={published ? "30px" : "36px"}
        >
          {published
            ? t(
                published.needsCoverage
                  ? "SellerOfferCreate.created.heading"
                  : "SellerOfferCreate.published.heading",
              )
            : t("SellerOfferCreate.title")}
        </Text>
      </Flex>

      {published ? (
        <SellerOfferPublished offer={published} />
      ) : (
        <FormSellerOffer
          organizationId={organizationId}
          locale={currencyLocale(i18n.language)}
          onCancel={() => router.push("/seller/offers")}
          onPublished={(offer) => {
            setPublished(offer);
            // O botão de criar fica no fim da revisão: volta ao topo.
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}
    </Stack>
  );
}

// Criação de oferta do seller: assistente em 5 etapas (Figma 2664-55368) e
// a confirmação depois de publicar (Figma 2074-55740).
export default function NewOfferPage() {
  return (
    <AuthenticatedLayout>
      <SellerSessionProvider>
        <NewOfferContent />
      </SellerSessionProvider>
    </AuthenticatedLayout>
  );
}
