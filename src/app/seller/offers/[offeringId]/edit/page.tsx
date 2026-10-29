"use client";

import { Box, Flex, Icon, Link, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { LuChevronLeft } from "react-icons/lu";

import FormSellerOffer from "@/components/Forms/FormSellerOffer";
import AuthenticatedLayout from "@/components/Layouts/Authenticated";
import SellerOfferLoadState from "@/components/SellerOfferLoadState";
import { toaster } from "@/components/ui/toaster";
import { useSession } from "@/contexts/SessionContext";
import { currencyLocale } from "@/functions/currencyLocale";
import { offeringToFormValues } from "@/functions/offeringToFormValues";
import { useOffering } from "@/hooks/useOffering";
import { useProductSpecifications } from "@/hooks/useProductSpecifications";

function EditOfferContent() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { profile } = useSession();
  const { offeringId } = useParams<{ offeringId: string }>();
  const { offering, isLoading, notFound, hasError, refetch } =
    useOffering(offeringId);
  const specs = useProductSpecifications();
  const detailHref = `/seller/offers/${encodeURIComponent(offeringId)}`;

  // A categoria vem do plano: espera a lista para abrir o assistente.
  const ready = !!offering && !specs.isLoading;
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

      {ready && offering ? (
        <FormSellerOffer
          // Remonta se a oferta mudar (valores iniciais do formulário).
          key={offering.id}
          mode="edit"
          offering={offering}
          initialValues={offeringToFormValues(offering, specificationName)}
          organizationId={profile?.organization.id ?? null}
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
            isLoading || (offering && specs.isLoading)
              ? "loading"
              : notFound || !hasError
                ? "notFound"
                : "error"
          }
          onRetry={refetch}
        />
      )}
    </Stack>
  );
}

// Edição da oferta: o assistente de criação com os dados salvos; a revisão
// final salva sem mudar o status.
export default function EditOfferPage() {
  return (
    <AuthenticatedLayout>
      <EditOfferContent />
    </AuthenticatedLayout>
  );
}
