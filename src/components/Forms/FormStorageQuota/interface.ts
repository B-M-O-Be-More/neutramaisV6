import type { OrganizationStorage } from "@/services/geoStorage.service";

export interface FormStorageQuotaProps {
  /** Situação atual: a cota vem preenchida e o consumo avisa a redução. */
  storage: OrganizationStorage;
  /** Organização exibida (só leitura) no topo do formulário. */
  organizationName: string;
  isSaving: boolean;
  /** Erro do envio (texto já traduzido). */
  error?: string;
  /** Idioma dos números (ex.: "pt-BR"). */
  locale: string;
  onSubmit: (input: { quotaMb: number; reason: string }) => void;
  onCancel: () => void;
}
