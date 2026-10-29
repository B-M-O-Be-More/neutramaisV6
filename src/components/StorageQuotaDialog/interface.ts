import type { UseOrganizationStorageReturn } from "@/hooks/useOrganizationStorage";

export interface StorageQuotaDialogProps {
  open: boolean;
  onClose: () => void;
  /** Estado da cota (useOrganizationStorage): o diálogo lê e altera por ele. */
  quota: Pick<
    UseOrganizationStorageReturn,
    "storage" | "isSaving" | "updateQuota"
  >;
  /** Nome exibido no diálogo e na confirmação. */
  organizationName: string;
  /** Idioma dos números (ex.: "pt-BR"). */
  locale: string;
}
