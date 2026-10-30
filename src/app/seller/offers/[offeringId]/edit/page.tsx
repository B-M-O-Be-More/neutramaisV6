"use client";

import { Box, Flex, Icon, Link, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { LuChevronLeft } from "react-icons/lu";

import FormSellerOffer from "@/components/Forms/FormSellerOffer";
import AuthenticatedLayout from "@/components/Layouts/Authenticated";
import SellerOfferLoadState from "@/components/SellerOfferLoadState";
import { toaster } from "@/components/ui/toaster";
import {
  SellerSessionProvider,
  useSellerSession,
} from "@/contexts/SellerSessionContext";
import { currencyLocale } from "@/functions/currencyLocale";
import { offeringToFormValues } from "@/functions/offeringToFormValues";
import { useOffering } from "@/hooks/useOffering";
import { useOfferingImages } from "@/hooks/useOfferingImages";
import { useProductSpecifications } from "@/hooks/useProductSpecifications";

function EditOfferContent() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { organizationId } = useSellerSession();
  const { offeringId } = useParams<{ offeringId: string }>();
  // `?section=photos` (ex.: vindo da publicação) abre direto nas fotos; a
  // cobertura (`?section=coverage`) fica na primeira etapa.
  const openPhotos = useSearchParams().get("section") === "photos";
  const { offering, isLoading, notFound, hasError, refetch } =
    useOffering(offeringId);
  const specs = useProductSpecifications();
  const images = useOfferingImages(offeringId);
  const detailHref = `/seller/offers/${encodeURIComponent(offeringId)}`;

  // A categoria vem do plano e as fotos salvas abrem a área de fotos: espera
  // as duas listas para abrir o assistente. Sem a lista de fotos, confirmar
  // poderia duplicar ou desordenar — vira erro com nova tentativa.
  const ready = !!offering && !specs.isLoading && !images.isLoading;
  const loadFailed = hasError || images.hasError;
  // Arquivada é só leitura (409 MKT_OFFER_ARCHIVED): nem abre o assistente.
  const isArchived = offering?.status === "archived";
  const specificationName = specs.specifications.find(
    (spec) => spec.id === offering?.specificationId,
  )?.name;

  return (
    <Stack
      maxW="1280px"
      px={{ base: 4, md: "32px" }}
      py={{ base: 6, md: "28px" }}
      gap="24px"
    >
      <Flex align="center" gap="8px">
        <Link
          asChild
          gap="8px"
          color="#5A6478"
          fontSize="14px"
          fontWeight={500}
          lineHeight="21px"
        >
          <NextLink href={detailHref}>
            <Icon as={LuChevronLeft} boxSize="18px" />
            {offering?.name ?? t("SellerOfferDetail.title")}
          </NextLink>
        </Link>
        <Box w="1px" h="20px" bg="#E5E8EE" />
        <Text
          as="h1"
          color="#0F1729"
          fontSize="20px"
          fontWeight={800}
          lineHeight="36px"
        >
          {t("SellerOfferEdit.title")}
        </Text>
      </Flex>

      {isArchived ? (
        <Stack
          align="center"
          gap="12px"
          py="48px"
          bg="white"
          borderWidth="1px"
          borderColor="#E5E8EE"
          rounded="22px"
          textAlign="center"
        >
          <Text color="#0F1729" fontSize="15px" fontWeight={700}>
            {t("SellerOfferEdit.errors.readOnly")}
          </Text>
          <Link asChild color="#1F5AFF" fontSize="13px" fontWeight={600}>
            <NextLink href={detailHref}>
              {t("SellerOfferDetail.title")}
            </NextLink>
          </Link>
        </Stack>
      ) : ready && offering && !images.hasError ? (
        <FormSellerOffer
          // Remonta se a oferta mudar (valores iniciais do formulário).
          key={offering.id}
          mode="edit"
          offering={offering}
          initialValues={offeringToFormValues(offering, specificationName)}
          images={images.images}
          initialStep={openPhotos ? 1 : 0}
          organizationId={organizationId}
          locale={currencyLocale(i18n.language)}
          onCancel={() => router.push(detailHref)}
          onSaved={(warnings) => {
            toaster.create({
              type: "success",
              title: t("SellerOfferEdit.saved", { name: offering.name }),
            });
            warnings.forEach((warning) =>
              toaster.create({ type: "warning", title: warning }),
            );
            router.push(detailHref);
          }}
        />
      ) : (
        <SellerOfferLoadState
          status={
            isLoading || (offering && (specs.isLoading || images.isLoading))
              ? "loading"
              : notFound || !loadFailed
                ? "notFound"
                : "error"
          }
          onRetry={() => {
            refetch();
            images.refetch();
          }}
        />
      )}
    </Stack>
  );
}

// Edição da oferta: o assistente de criação com os dados salvos; a revisão
// final salva sem mudar o status. useSearchParams (`?section=…`) exige um
// limite de Suspense no App Router.
export default function EditOfferPage() {
  return (
    <AuthenticatedLayout>
      <SellerSessionProvider>
        <Suspense>
          <EditOfferContent />
        </Suspense>
      </SellerSessionProvider>
    </AuthenticatedLayout>
  );
}
