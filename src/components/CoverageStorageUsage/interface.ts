import type { ReactNode } from "react";

import type { OrganizationStorage } from "@/services/geoStorage.service";

export interface CoverageStorageUsageProps {
  storage: OrganizationStorage | null;
  isLoading: boolean;
  /** Chave de tradução quando a leitura falhou. */
  error: string | null;
  onReload: () => void;
  /** Idioma dos números (ex.: "pt-BR"). */
  locale: string;
  /** Ação ao lado do título (ex.: "Alterar cota" na área admin). */
  action?: ReactNode;
}
