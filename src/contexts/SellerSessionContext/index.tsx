"use client";

import React from "react";

import {
  ProfileSessionProvider,
  useProfileSession,
} from "@/contexts/ProfileSessionContext";

import { SellerSessionProviderProps } from "./interface";

// Permissão que a geo-api exige para ler as coberturas.
const COVERAGE_READ_PERMISSION = "geo:coverage:read";

/**
 * Sessão de perfil Seller da área do seller (identity-api `/auth/context`).
 * Por padrão só libera com `geo:coverage:read`, a permissão das coberturas.
 */
const SellerSessionProvider: React.FC<SellerSessionProviderProps> = ({
  requiredPermission = COVERAGE_READ_PERMISSION,
  children,
}) => (
  <ProfileSessionProvider
    profile="seller"
    requiredPermission={requiredPermission}
  >
    {children}
  </ProfileSessionProvider>
);

const useSellerSession = useProfileSession;

export { SellerSessionProvider, useSellerSession };
