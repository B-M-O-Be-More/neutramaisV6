import type { ContractEntry } from "@/types/contracts";

export interface UseContractReturn {
  entry: ContractEntry | null;
  isLoading: boolean;
  /** Chave i18n do erro da leitura; null sem erro. */
  errorKey: string | null;
  /** Lê de novo mostrando o carregamento (ex.: após erro). */
  reload: () => void;
  /** Lê de novo em segundo plano (ex.: "Atualizar status"). */
  refresh: () => void;
}
