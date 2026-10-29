"use client";

import { Box, Flex, Icon, Link, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { useParams, useRouter } from "next/navigation";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuChevronLeft } from "react-icons/lu";

import AuthenticatedLayout from "@/components/Layouts/Authenticated";
import SellerOfferDetail from "@/components/SellerOfferDetail";
import SellerOfferLoadState from "@/components/SellerOfferLoadState";
import { toaster } from "@/components/ui/toaster";
import { currencyLocale } from "@/functions/currencyLocale";
import { useOffering } from "@/hooks/useOffering";
import { useProductSpecifications } from "@/hooks/useProductSpecifications";
import { ForbiddenError } from "@/services/errors";
import { productCatalogService } from "@/services/productCatalog.service";

function OfferDetailContent() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { offeringId } = useParams<{ offeringId: string }>();
  const { offering, isLoading, notFound, hasError, refetch } =
    useOffering(offeringId);
  const { specifications } = useProductSpecifications();
  const [isPromoting, setIsPromoting] = React.useState(false);

  const specificationName = specifications.find(
    (spec) => spec.id === offering?.specificationId,
  )?.name;

  const togglePromotion = async () => {
    if (!offering) return;
    const next = !offering.isPromoted;
    setIsPromoting(true);
    try {
      await productCatalogService.setPromotion(offering.id, next);
      toaster.create({
        type: "success",
        title: next
          ? t("SellerOfferDetail.toasts.sponsored")
          : t("SellerOfferDetail.toasts.unsponsored"),
      });
      refetch();
    } catch (error) {
      toaster.create({
        type: "error",
        title:
          error instanceof ForbiddenError
            ? t("SellerOfferCreate.publish.warnings.promotionForbidden")
            : t("SellerOfferCreate.publish.warnings.promotionFailed"),
      });
    } finally {
      setIsPromoting(false);
    }
  };

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
          lineHeight="36px"
        >
          {t("SellerOfferDetail.title")}
        </Text>
      </Flex>

      {offering ? (
        <SellerOfferDetail
          offering={offering}
          specificationName={specificationName}
          locale={currencyLocale(i18n.language)}
          isPromoting={isPromoting}
          onBack={() => router.push("/seller/offers")}
          onEdit={() =>
            router.push(
              `/seller/offers/${encodeURIComponent(offering.id)}/edit`,
            )
          }
          onTogglePromotion={togglePromotion}
        />
      ) : (
        <SellerOfferLoadState
          status={
            isLoading ? "loading" : notFound || !hasError ? "notFound" : "error"
          }
          onRetry={refetch}
        />
      )}
    </Stack>
  );
}

// Detalhe da oferta no catálogo do seller (Figma 2098-31809), com as ações
// de editar e patrocinar.
export default function OfferDetailPage() {
  return (
    <AuthenticatedLayout>
      <OfferDetailContent />
    </AuthenticatedLayout>
  );
}
