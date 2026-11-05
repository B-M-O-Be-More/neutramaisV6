export interface AdminCoverageStorageProps {
  /** Organização (Seller) cuja cota é exibida e alterada. */
  organizationId: string;
  /** Nome exibido no diálogo de alteração. */
  organizationName: string;
  /** Idioma dos números (ex.: "pt-BR"). */
  locale: string;
}
