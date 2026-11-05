"use client";

import React from "react";

import {
  organizationsService,
  type OrganizationAddress,
} from "@/services/organizations.service";

import type { UseOrganizationAddressReturn } from "./interface";

/**
 * Endereço legal (sede) da organização na identity-api. Sem endereço (404) ou
 * com falha, volta null — a tela mostra "—". Sem `organizationId`, não
 * consulta.
 */
export function useOrganizationAddress(
  organizationId: string | null,
): UseOrganizationAddressReturn {
  const [result, setResult] = React.useState<{
    key: string;
    address: OrganizationAddress | null;
  } | null>(null);

  React.useEffect(() => {
    if (!organizationId) return;
    const controller = new AbortController();

    organizationsService
      .getAddress(organizationId, { signal: controller.signal })
      .then((address) =>
        setResult({ key: organizationId, address: address ?? null }),
      )
      .catch(() => {
        if (!controller.signal.aborted) {
          setResult({ key: organizationId, address: null });
        }
      });

    return () => controller.abort();
  }, [organizationId]);

  const isCurrent = !!organizationId && result?.key === organizationId;
  return {
    address: isCurrent ? result.address : null,
    isLoading: !!organizationId && !isCurrent,
  };
}
