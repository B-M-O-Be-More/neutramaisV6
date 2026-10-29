import type {
  OrganizationStorage,
  UpdateQuotaInput,
} from "@/services/geoStorage.service";

export type UpdateQuotaResult =
  | { ok: true; storage: OrganizationStorage }
  | { ok: false; /** Chave de tradução do erro. */ errorKey: string };

export interface UseOrganizationStorageReturn {
  storage: OrganizationStorage | null;
  isLoading: boolean;
  /** Chave de tradução quando a leitura falhou. */
  error: string | null;
  reload: () => void;
  isSaving: boolean;
  /** Altera a cota (só `super_admin`) e já mostra o novo saldo. */
  updateQuota: (input: UpdateQuotaInput) => Promise<UpdateQuotaResult>;
}
