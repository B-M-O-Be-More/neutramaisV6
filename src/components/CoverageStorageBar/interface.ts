import type { OrganizationStorage } from "@/services/geoStorage.service";

export interface CoverageStorageBarProps {
  /** Consumo da cota; null enquanto carrega ou em erro (não mostra nada). */
  storage: OrganizationStorage | null;
  /** Idioma dos números (ex.: "pt-BR"). */
  locale: string;
}
