"use client";

import {
  Button,
  Flex,
  NativeSelect,
  Stack,
  Switch,
  Text,
} from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuChevronDown, LuGlobe } from "react-icons/lu";

import ProfileCard from "@/components/ProfileCard";
import { toaster } from "@/components/ui/toaster";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Language } from "@/contexts/LanguageContext/interface";
import type { ProfilePreferences } from "@/services/profile.service";

import { ProfilePreferencesTabProps } from "./interface";

const LANGUAGES: Language[] = ["pt", "en", "es"];
const CURRENCIES = ["BRL", "USD", "EUR"];

// SMS não tem canal na plataforma ainda: fica desligado e bloqueado.
const NOTIFICATIONS = ["email", "sms", "orders", "rfq", "marketing"] as const;
type NotificationKey = (typeof NOTIFICATIONS)[number];

const INITIAL: ProfilePreferences = {
  notifications: {
    email: true,
    sms: false,
    orders: true,
    rfq: true,
    marketing: false,
  },
  autoSale: false,
  currency: "BRL",
};

/** Idioma do navegador entre os suportados (padrão: português). */
function systemLanguage(): Language {
  const code =
    typeof navigator === "undefined" ? "pt" : navigator.language.slice(0, 2);
  return (LANGUAGES as string[]).includes(code) ? (code as Language) : "pt";
}

function PreferenceRow({
  title,
  description,
  control,
  isLast = false,
}: {
  title: string;
  description?: string;
  control: React.ReactNode;
  isLast?: boolean;
}) {
  return (
    <Flex
      align="center"
      justify="space-between"
      gap="16px"
      py="12px"
      borderBottomWidth={isLast ? 0 : "1px"}
      borderColor="#F4F6F9"
    >
      <Stack gap="2px" minW={0}>
        <Text
          color="#0F1729"
          fontSize="13px"
          fontWeight={600}
          lineHeight="19.5px"
        >
          {title}
        </Text>
        {description && (
          <Text
            color="#8A9AB5"
            fontSize="11px"
            lineHeight="16.5px"
            whiteSpace="pre-line"
          >
            {description}
          </Text>
        )}
      </Stack>
      {control}
    </Flex>
  );
}

function Toggle({
  label,
  checked,
  disabled = false,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <Switch.Root
      checked={checked}
      disabled={disabled}
      onCheckedChange={(details) => onChange(details.checked)}
      flexShrink={0}
    >
      <Switch.HiddenInput aria-label={label} />
      <Switch.Control bg={checked ? "#1F5AFF" : "#D5DBE5"}>
        <Switch.Thumb />
      </Switch.Control>
    </Switch.Root>
  );
}

function SaveButton({
  onClick,
  isLoading,
}: {
  onClick: () => void;
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Button
      alignSelf="flex-end"
      h="36px"
      px="16px"
      bg="#1F5AFF"
      rounded="14px"
      color="white"
      fontSize="12px"
      fontWeight={700}
      _hover={{ bg: "#1A4FE0" }}
      loading={isLoading}
      onClick={onClick}
    >
      {t("Profile.preferences.save")}
    </Button>
  );
}

const SELECT_FIELD = {
  h: "34px",
  ps: "12px",
  pe: "32px",
  bg: "white",
  borderWidth: "1px",
  borderColor: "#E5E8EE",
  rounded: "10px",
  color: "#5A6478",
  fontSize: "12px",
} as const;

/**
 * Aba "Preferências" (Figma 2206-27085): notificações, venda automática,
 * moeda e idioma. O idioma vale na hora (preferência deste navegador); as
 * demais ainda não têm rota de gravação.
 */
export function ProfilePreferencesTab({
  personas,
  onSave,
}: ProfilePreferencesTabProps) {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const [preferences, setPreferences] = React.useState(INITIAL);
  const [saving, setSaving] = React.useState<string | null>(null);
  const [error, setError] = React.useState<{
    section: string;
    key: string;
  } | null>(null);
  const [followSystem, setFollowSystem] = React.useState(
    () => language === systemLanguage(),
  );
  const [chosenLanguage, setChosenLanguage] = React.useState(language);

  const save = async (section: string) => {
    setSaving(section);
    setError(null);
    const key = await onSave(preferences);
    setSaving(null);
    if (key) setError({ section, key });
  };

  const saveLanguage = () => {
    setLanguage(followSystem ? systemLanguage() : chosenLanguage);
    toaster.create({
      type: "success",
      title: t("Profile.preferences.language.saved"),
    });
  };

  const sectionError = (section: string) =>
    error?.section === section ? (
      <Text role="alert" color="#EF4444" fontSize="12px" lineHeight="18px">
        {t(error.key)}
      </Text>
    ) : null;

  const setNotification = (key: NotificationKey, value: boolean) =>
    setPreferences((current) => ({
      ...current,
      notifications: { ...current.notifications, [key]: value },
    }));

  return (
    <Stack gap="20px">
      <ProfileCard title={t("Profile.preferences.notifications.title")}>
        <Stack gap="0">
          {NOTIFICATIONS.map((key, index) => (
            <PreferenceRow
              key={key}
              title={t(`Profile.preferences.notifications.${key}.title`)}
              description={t(
                `Profile.preferences.notifications.${key}.description`,
              )}
              isLast={index === NOTIFICATIONS.length - 1}
              control={
                <Toggle
                  label={t(`Profile.preferences.notifications.${key}.title`)}
                  checked={preferences.notifications[key]}
                  disabled={key === "sms"}
                  onChange={(value) => setNotification(key, value)}
                />
              }
            />
          ))}
        </Stack>
        {sectionError("notifications")}
        <SaveButton
          onClick={() => save("notifications")}
          isLoading={saving === "notifications"}
        />
      </ProfileCard>

      {personas.includes("seller") && (
        <ProfileCard title={t("Profile.preferences.sales.title")}>
          <PreferenceRow
            title={t("Profile.preferences.sales.autoSale")}
            description={t("Profile.preferences.sales.autoSaleDescription")}
            isLast
            control={
              <Toggle
                label={t("Profile.preferences.sales.autoSale")}
                checked={preferences.autoSale}
                onChange={(autoSale) =>
                  setPreferences((current) => ({ ...current, autoSale }))
                }
              />
            }
          />
          {sectionError("sales")}
          <SaveButton
            onClick={() => save("sales")}
            isLoading={saving === "sales"}
          />
        </ProfileCard>
      )}

      <ProfileCard title={t("Profile.preferences.currency.title")}>
        <PreferenceRow
          title={t("Profile.preferences.currency.choose")}
          description={t("Profile.preferences.currency.description")}
          isLast
          control={
            <NativeSelect.Root w="auto" flexShrink={0}>
              <NativeSelect.Field
                aria-label={t("Profile.preferences.currency.choose")}
                value={preferences.currency}
                onChange={(event) =>
                  setPreferences((current) => ({
                    ...current,
                    currency: event.target.value,
                  }))
                }
                {...SELECT_FIELD}
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency} value={currency}>
                    {t(`Profile.preferences.currency.options.${currency}`)}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator>
                <LuChevronDown />
              </NativeSelect.Indicator>
            </NativeSelect.Root>
          }
        />
        {sectionError("currency")}
        <SaveButton
          onClick={() => save("currency")}
          isLoading={saving === "currency"}
        />
      </ProfileCard>

      <ProfileCard title={t("Profile.preferences.language.title")}>
        <Stack gap="0">
          <PreferenceRow
            title={t("Profile.preferences.language.system")}
            description={t("Profile.preferences.language.systemDescription")}
            control={
              <Toggle
                label={t("Profile.preferences.language.system")}
                checked={followSystem}
                onChange={setFollowSystem}
              />
            }
          />
          <PreferenceRow
            title={t("Profile.preferences.language.choose")}
            description={t("Profile.preferences.language.chooseDescription")}
            isLast
            control={
              <NativeSelect.Root
                w="auto"
                flexShrink={0}
                disabled={followSystem}
              >
                <NativeSelect.Field
                  aria-label={t("Profile.preferences.language.choose")}
                  value={chosenLanguage}
                  onChange={(event) =>
                    setChosenLanguage(event.target.value as Language)
                  }
                  {...SELECT_FIELD}
                  ps="30px"
                >
                  {LANGUAGES.map((option) => (
                    <option key={option} value={option}>
                      {t(`Profile.preferences.language.options.${option}`)}
                    </option>
                  ))}
                </NativeSelect.Field>
                <LuGlobe
                  style={{
                    position: "absolute",
                    left: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 12,
                    height: 12,
                    color: "#8A9AB5",
                    pointerEvents: "none",
                  }}
                />
                <NativeSelect.Indicator>
                  <LuChevronDown />
                </NativeSelect.Indicator>
              </NativeSelect.Root>
            }
          />
        </Stack>
        <SaveButton onClick={saveLanguage} isLoading={false} />
      </ProfileCard>
    </Stack>
  );
}
