"use client";

import { Flex, Icon, Input, Stack, Text, Textarea } from "@chakra-ui/react";
import { Controller, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { LuCircleAlert } from "react-icons/lu";

import OfferFormField, {
  OFFER_INPUT_STYLES,
  offerFieldDescribedBy,
} from "@/components/OfferFormField";
import OfferImagePicker from "@/components/OfferImagePicker";
import {
  OFFER_DESCRIPTION_MAX,
  OFFER_DESCRIPTION_MIN,
  OFFER_NAME_MAX,
  OFFER_SHORT_DESCRIPTION_MAX,
} from "@/schemas/sellerOffer";

import { SellerOfferBasicInfoStepProps } from "./interface";

/**
 * Etapa 2 da criação de oferta (Figma 2073-44741): imagem, nome e
 * descrições, com contadores de caracteres. O nome e a descrição curta
 * alimentam o preview do marketplace.
 */
export function SellerOfferBasicInfoStep({
  control,
  register,
  errors,
}: SellerOfferBasicInfoStepProps) {
  const { t } = useTranslation();
  const name = useWatch({ control, name: "name" }) ?? "";
  const shortDescription =
    useWatch({ control, name: "shortDescription" }) ?? "";
  const description = useWatch({ control, name: "description" }) ?? "";

  const tError = (message?: string) => (message ? t(message) : undefined);
  const nameError = tError(errors.name?.message);
  const shortDescriptionError = tError(errors.shortDescription?.message);
  const descriptionError = tError(errors.description?.message);
  const descriptionHelper = t(
    "SellerOfferCreate.basicInfo.descriptionCounter",
    {
      min: OFFER_DESCRIPTION_MIN,
      count: description.trim().length,
    },
  );

  return (
    <Stack gap="24px">
      <Flex
        align="flex-start"
        gap="12px"
        px="17px"
        py="15px"
        bg="#FFFBEB"
        borderWidth="1px"
        borderColor="#FDE68A"
        rounded="14px"
      >
        <Icon
          as={LuCircleAlert}
          boxSize="13px"
          color="#D97706"
          mt="2px"
          flexShrink={0}
        />
        <Text color="#92400E" fontSize="12px" lineHeight="18px">
          {t("SellerOfferCreate.basicInfo.autoPublishNotice")}
        </Text>
      </Flex>

      <Controller
        control={control}
        name="image"
        render={({ field }) => (
          <OfferImagePicker
            value={field.value ?? null}
            onChange={field.onChange}
            error={tError(errors.image?.message)}
          />
        )}
      />

      <OfferFormField
        id="offer-name"
        label={t("SellerOfferCreate.basicInfo.nameLabel")}
        required
        error={nameError}
        counter={`${name.length}/${OFFER_NAME_MAX}`}
      >
        <Input
          id="offer-name"
          {...register("name")}
          maxLength={OFFER_NAME_MAX}
          placeholder={t("SellerOfferCreate.basicInfo.namePlaceholder")}
          aria-invalid={!!nameError}
          aria-describedby={offerFieldDescribedBy("offer-name", {
            error: nameError,
          })}
          h="47px"
          fontSize="14px"
          borderColor={nameError ? "#EF4444" : "#E5E8EE"}
          {...OFFER_INPUT_STYLES}
        />
      </OfferFormField>

      <OfferFormField
        id="offer-short-description"
        label={t("SellerOfferCreate.basicInfo.shortDescriptionLabel")}
        required
        error={shortDescriptionError}
        counter={`${shortDescription.length}/${OFFER_SHORT_DESCRIPTION_MAX}`}
      >
        <Input
          id="offer-short-description"
          {...register("shortDescription")}
          maxLength={OFFER_SHORT_DESCRIPTION_MAX}
          placeholder={t(
            "SellerOfferCreate.basicInfo.shortDescriptionPlaceholder",
          )}
          aria-invalid={!!shortDescriptionError}
          aria-describedby={offerFieldDescribedBy("offer-short-description", {
            error: shortDescriptionError,
          })}
          h="45.5px"
          fontSize="13px"
          borderColor={shortDescriptionError ? "#EF4444" : "#E5E8EE"}
          {...OFFER_INPUT_STYLES}
        />
      </OfferFormField>

      <OfferFormField
        id="offer-description"
        label={t("SellerOfferCreate.basicInfo.descriptionLabel")}
        required
        error={descriptionError}
        helper={descriptionHelper}
      >
        <Textarea
          id="offer-description"
          {...register("description")}
          maxLength={OFFER_DESCRIPTION_MAX}
          placeholder={t("SellerOfferCreate.basicInfo.descriptionPlaceholder")}
          aria-invalid={!!descriptionError}
          aria-describedby={offerFieldDescribedBy("offer-description", {
            error: descriptionError,
            helper: descriptionHelper,
          })}
          h="143px"
          py="13px"
          resize="vertical"
          fontSize="13px"
          lineHeight="19.5px"
          borderColor={descriptionError ? "#EF4444" : "#E5E8EE"}
          {...OFFER_INPUT_STYLES}
        />
      </OfferFormField>
    </Stack>
  );
}
