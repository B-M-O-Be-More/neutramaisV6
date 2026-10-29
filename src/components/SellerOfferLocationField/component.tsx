"use client";

import { Button, Flex, Icon, InputGroup, Stack, Text } from "@chakra-ui/react";
import {
  Controller,
  useController,
  useFieldArray,
  type Control,
  type FieldErrors,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import { LuMinus, LuPlus } from "react-icons/lu";

import AddressAutocomplete from "@/components/AddressAutocomplete";
import OfferFormField, {
  OFFER_INPUT_STYLES,
  offerFieldDescribedBy,
} from "@/components/OfferFormField";
import OfferMaskedInput, {
  RADIUS_KM_MASK,
} from "@/components/OfferMaskedInput";
import {
  EMPTY_OFFER_LOCATION,
  OFFER_LOCATION_RADIUS_MAX_KM,
  OFFER_LOCATIONS_MAX,
  type SellerOfferValues,
} from "@/schemas/sellerOffer";

import { SellerOfferLocationFieldProps } from "./interface";

/** Botão quadrado de + / − ao lado do endereço. */
const rowButton = {
  boxSize: "47px",
  minW: "47px",
  p: 0,
  bg: "white",
  borderWidth: "1px",
  borderColor: "#E5E8EE",
  rounded: "14px",
  color: "#5A6478",
  _hover: { bg: "#F8F9FB", color: "#0F1729" },
  _disabled: { opacity: 0.5, cursor: "not-allowed" },
} as const;

/**
 * Localidades de atendimento (A/Z): o seller busca o endereço (sugestões do
 * Mapbox), escolhe um — o mapa ganha o pin — e então informa o raio em km,
 * desenhado em volta do ponto. O "+" acrescenta outra localidade e o "−"
 * remove a da linha. Opcionais; a marketplace-api ainda não tem campo para
 * elas, então ficam no assistente e não são enviadas.
 */
export function SellerOfferLocationField({
  control,
  errors,
}: SellerOfferLocationFieldProps) {
  const { t } = useTranslation();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "locations",
  });
  const canAdd = fields.length < OFFER_LOCATIONS_MAX;

  return (
    <Stack gap="16px">
      {fields.map((field, index) => (
        <LocationRow
          key={field.id}
          control={control}
          errors={errors}
          index={index}
          isLast={index === fields.length - 1}
          canRemove={fields.length > 1}
          canAdd={canAdd}
          onAdd={() => append({ ...EMPTY_OFFER_LOCATION })}
          onRemove={() => remove(index)}
        />
      ))}
      {!canAdd && (
        <Text color="#A0ABB8" fontSize="11px" lineHeight="16.5px">
          {t("SellerOfferCreate.coverage.locationsMax", {
            max: OFFER_LOCATIONS_MAX,
          })}
        </Text>
      )}
    </Stack>
  );
}

interface LocationRowProps {
  control: Control<SellerOfferValues>;
  errors: FieldErrors<SellerOfferValues>;
  index: number;
  isLast: boolean;
  canRemove: boolean;
  canAdd: boolean;
  onAdd: () => void;
  onRemove: () => void;
}

/** Uma localidade: endereço, botões + / − e, com o ponto escolhido, o raio. */
function LocationRow({
  control,
  errors,
  index,
  isLast,
  canRemove,
  canAdd,
  onAdd,
  onRemove,
}: LocationRowProps) {
  const { t } = useTranslation();
  const label = useController({ control, name: `locations.${index}.label` });
  const longitude = useController({
    control,
    name: `locations.${index}.longitude`,
  });
  const latitude = useController({
    control,
    name: `locations.${index}.latitude`,
  });

  const hasPoint =
    typeof longitude.field.value === "number" &&
    typeof latitude.field.value === "number";

  const number = index + 1;
  const tError = (message?: string) => (message ? t(message) : undefined);
  const rowErrors = errors.locations?.[index];
  const labelError = tError(rowErrors?.label?.message);
  const radiusError = tError(rowErrors?.radiusKm?.message);
  const radiusHelper = t("SellerOfferCreate.coverage.radiusHelper", {
    max: OFFER_LOCATION_RADIUS_MAX_KM,
  });
  const radiusId = `offer-location-${index}-radius`;

  return (
    <Stack gap="16px">
      <AddressAutocomplete
        id={`offer-location-${index}-address`}
        label={
          index === 0
            ? t("SellerOfferCreate.coverage.locationLabel")
            : t("SellerOfferCreate.coverage.locationItemLabel", { number })
        }
        labelHint={
          index === 0
            ? t("SellerOfferCreate.coverage.locationOptional")
            : undefined
        }
        placeholder={t("SellerOfferCreate.coverage.locationPlaceholder")}
        inputValue={label.field.value ?? ""}
        error={labelError}
        onInputChange={(text) => {
          // Digitar desfaz o endereço escolhido (e tira o pin do mapa).
          label.field.onChange(text);
          longitude.field.onChange(null);
          latitude.field.onChange(null);
        }}
        onSelect={(result) => {
          label.field.onChange(result.label);
          longitude.field.onChange(result.longitude);
          latitude.field.onChange(result.latitude);
        }}
        endAction={
          <>
            {canRemove && (
              <Button
                {...rowButton}
                aria-label={t("SellerOfferCreate.coverage.locationRemove", {
                  number,
                })}
                onClick={onRemove}
              >
                <Icon as={LuMinus} boxSize="16px" />
              </Button>
            )}
            {isLast && (
              <Button
                {...rowButton}
                aria-label={t("SellerOfferCreate.coverage.locationAdd")}
                disabled={!canAdd}
                onClick={onAdd}
              >
                <Icon as={LuPlus} boxSize="16px" />
              </Button>
            )}
          </>
        }
      />

      {/* O raio só aparece depois de escolher o endereço. */}
      {hasPoint && (
        <Flex maxW={{ base: "full", md: "50%" }} direction="column">
          <OfferFormField
            id={radiusId}
            label={
              index === 0
                ? t("SellerOfferCreate.coverage.radiusLabel")
                : t("SellerOfferCreate.coverage.radiusItemLabel", { number })
            }
            required
            error={radiusError}
            helper={radiusHelper}
          >
            <InputGroup
              endElement={
                <Text color="#5A6478" fontSize="14px" aria-hidden="true">
                  km
                </Text>
              }
              endElementProps={{ pe: "17px" }}
            >
              <Controller
                control={control}
                name={`locations.${index}.radiusKm`}
                render={({ field }) => (
                  <OfferMaskedInput
                    id={radiusId}
                    ref={field.ref}
                    name={field.name}
                    maskOptions={RADIUS_KM_MASK}
                    value={field.value ?? ""}
                    onAccept={field.onChange}
                    onBlur={field.onBlur}
                    inputMode="decimal"
                    placeholder="10"
                    aria-invalid={!!radiusError}
                    aria-describedby={offerFieldDescribedBy(radiusId, {
                      error: radiusError,
                      helper: radiusHelper,
                    })}
                    h="47px"
                    fontSize="14px"
                    borderColor={radiusError ? "#EF4444" : "#E5E8EE"}
                    {...OFFER_INPUT_STYLES}
                    pe="48px"
                  />
                )}
              />
            </InputGroup>
          </OfferFormField>
        </Flex>
      )}
    </Stack>
  );
}
