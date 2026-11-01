"use client";

import { useRouter } from "next/navigation";
import React from "react";

import AuthenticatedLayout from "@/components/Layouts/Authenticated";
import { PROFILE_TABS, type ProfileTab } from "@/components/ProfileTabs";
import UserProfile from "@/components/UserProfile";

function parseTab(value: string | string[] | undefined): ProfileTab {
  return (PROFILE_TABS as readonly string[]).includes(String(value))
    ? (value as ProfileTab)
    : "personal";
}

// Meu Perfil (Figma 2205-18339). A aba aberta fica em `?tab=`, para os links
// de outras telas (ex.: Segurança) caírem direto nela.
export default function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { tab } = React.use(searchParams);
  const router = useRouter();

  return (
    <AuthenticatedLayout>
      <UserProfile
        initialTab={parseTab(tab)}
        onTabChange={(next) =>
          router.replace(
            next === "personal" ? "/profile" : `/profile?tab=${next}`,
            {
              scroll: false,
            },
          )
        }
      />
    </AuthenticatedLayout>
  );
}
