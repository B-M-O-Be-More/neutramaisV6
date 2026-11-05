import type {
  AutoAcceptPolicy,
  SlaConfig,
  UpdateSlaConfigInput,
} from "@/services/salesSettings.service";

export interface SalesSettingsSection<T> {
  data: T | null;
  isLoading: boolean;
  /** Chave de tradução da falha ao ler. */
  loadErrorKey?: string;
  reload: () => void;
  isSaving: boolean;
  /** Chave de tradução da falha ao gravar. */
  saveErrorKey?: string;
  /** Gravou com sucesso desde a última edição. */
  saved: boolean;
}

export interface UseSalesSettingsReturn {
  sla: SalesSettingsSection<SlaConfig> & {
    save: (input: UpdateSlaConfigInput) => Promise<void>;
  };
  autoAccept: SalesSettingsSection<AutoAcceptPolicy> & {
    /** Liga ou desliga (usa a versão lida; 409 relê). */
    save: (autoAccept: boolean) => Promise<void>;
  };
}
