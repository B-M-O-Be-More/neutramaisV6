"use client";

import { Button, Skeleton, Stack, Text } from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuUser } from "react-icons/lu";

import CollapsibleNotice from "@/components/CollapsibleNotice";
import ProfileAccessTab from "@/components/ProfileAccessTab";
import ProfileCompanyTab from "@/components/ProfileCompanyTab";
import ProfileHeader from "@/components/ProfileHeader";
import ProfilePersonalTab from "@/components/ProfilePersonalTab";
import ProfilePreferencesTab from "@/components/ProfilePreferencesTab";
import ProfileSecurityTab from "@/components/ProfileSecurityTab";
import ProfileSupportTab from "@/components/ProfileSupportTab";
import ProfileTabs, { type ProfileTab } from "@/components/ProfileTabs";
import { toaster } from "@/components/ui/toaster";
import { useSession } from "@/contexts/SessionContext";
import { currencyLocale } from "@/functions/currencyLocale";
import { primaryRole } from "@/functions/profile";
import { useOrganizationAddress } from "@/hooks/useOrganizationAddress";
import {
  ProfileFeatureUnavailableError,
  profileService,
} from "@/services/profile.service";

import { UserProfileProps } from "./interface";

const KYC_HREF = "/kyc";
const NEW_TICKET_HREF = "/tickets/new";

// O user agent não muda: nada a observar.
const subscribeNothing = () => () => {};

/** Roda a ação do perfil; devolve a chave de tradução do erro, ou null. */
async function runAction(action: () => Promise<void>): Promise<string | null> {
  try {
    await action();
    return null;
  } catch (error) {
    return error instanceof ProfileFeatureUnavailableError
      ? "Profile.errors.unavailable"
      : "Profile.errors.failed";
  }
}

/**
 * Meu Perfil (Figma 2205-18339 e seguintes): cabeçalho com foto e bio, e as
 * abas de dados pessoais, empresa, papéis, segurança, preferências e suporte.
 * Os dados vêm do `GET /me` e do endereço da organização; editar o perfil, a
 * senha, as sessões e as preferências ainda não têm rota e avisam isso.
 */
export function UserProfile({ initialTab, onTabChange }: UserProfileProps) {
  const { t, i18n } = useTranslation();
  const locale = currencyLocale(i18n.language);
  const { status, profile, personas, reload } = useSession();
  const { address, isLoading: isLoadingAddress } = useOrganizationAddress(
    profile?.organization.id ?? null,
  );
  const [tab, setTab] = React.useState<ProfileTab>(initialTab);
  const [isEditing, setEditing] = React.useState(false);
  const [showNotice, setShowNotice] = React.useState(true);
  // O navegador só existe no cliente: no servidor (e na hidratação), vazio.
  const userAgent = React.useSyncExternalStore(
    subscribeNothing,
    () => navigator.userAgent,
    () => "",
  );

  const changeTab = (next: ProfileTab) => {
    setTab(next);
    if (next !== "personal") setEditing(false);
    onTabChange?.(next);
  };

  const startEditing = () => {
    changeTab("personal");
    setEditing(true);
  };

  const notice = showNotice && (
    <CollapsibleNotice
      tone="blue"
      icon={LuUser}
      title={t("Profile.notice.title")}
      description={t("Profile.notice.description")}
      labels={{
        collapse: t("Profile.notice.collapse"),
        expand: t("Profile.notice.expand"),
        dismiss: t("Profile.notice.dismiss"),
      }}
      onDismiss={() => setShowNotice(false)}
    />
  );

  let body: React.ReactNode;
  if (status === "error") {
    body = (
      <Stack gap="8px" align="flex-start">
        <Text color="#8A9AB5" fontSize="13px">
          {t("Profile.errors.loadFailed")}
        </Text>
        <Button
          variant="plain"
          h="auto"
          p="0"
          color="#1F5AFF"
          fontSize="13px"
          fontWeight={600}
          onClick={reload}
        >
          {t("Profile.actions.retry")}
        </Button>
      </Stack>
    );
  } else if (!profile) {
    body = (
      <Stack gap="20px" aria-busy="true">
        <Skeleton h="240px" rounded="14px" />
        <Skeleton h="44px" rounded="14px" />
        <Skeleton h="320px" rounded="14px" />
      </Stack>
    );
  } else {
    const role = primaryRole(profile.roles);
    const jobTitle = role ? t(`Profile.roles.${role}`) : "";

    body = (
      <>
        <ProfileHeader
          name={profile.display_name}
          subtitle={jobTitle}
          bio=""
          onEdit={startEditing}
          onPhotoSelect={async (file) => {
            const error = await runAction(() =>
              profileService.uploadPhoto(file),
            );
            if (error) toaster.create({ type: "error", title: t(error) });
          }}
        />

        <ProfileTabs value={tab} onChange={changeTab} />

        <Stack
          role="tabpanel"
          id={`profile-panel-${tab}`}
          aria-labelledby={`profile-tab-${tab}`}
          gap="20px"
        >
          {tab === "personal" && (
            <ProfilePersonalTab
              profile={profile}
              jobTitle={jobTitle}
              locale={locale}
              isEditing={isEditing}
              onCancelEdit={() => setEditing(false)}
              onSave={(values) =>
                runAction(() => profileService.updatePersonalData(values))
              }
            />
          )}
          {tab === "company" && (
            <ProfileCompanyTab
              profile={profile}
              address={address}
              isLoadingAddress={isLoadingAddress}
            />
          )}
          {tab === "access" && (
            <ProfileAccessTab
              profile={profile}
              personas={personas}
              kycHref={KYC_HREF}
            />
          )}
          {tab === "security" && (
            <ProfileSecurityTab
              profile={profile}
              locale={locale}
              userAgent={userAgent}
              onChangePassword={({ currentPassword, newPassword }) =>
                runAction(() =>
                  profileService.changePassword({
                    currentPassword,
                    newPassword,
                  }),
                )
              }
              onRevokeOthers={() =>
                runAction(() => profileService.revokeOtherSessions())
              }
              closeAccountHref={NEW_TICKET_HREF}
            />
          )}
          {tab === "preferences" && (
            <ProfilePreferencesTab
              personas={personas}
              onSave={(preferences) =>
                runAction(() => profileService.savePreferences(preferences))
              }
            />
          )}
          {tab === "support" && (
            <ProfileSupportTab
              locale={locale}
              newTicketHref={NEW_TICKET_HREF}
            />
          )}
        </Stack>
      </>
    );
  }

  return (
    <Stack
      maxW="1280px"
      px={{ base: 4, md: "32px" }}
      py={{ base: 6, md: "28px" }}
      gap="20px"
    >
      {notice}
      {body}
    </Stack>
  );
}
