import type { ContractEntry, ContractsSummary } from "@/types/contracts";

export interface UseContractsReturn {
  /** Contratos com o pedido de cada um, do mais novo ao mais antigo. */
  entries: ContractEntry[];
  summary: ContractsSummary;
  isLoading: boolean;
  /** Chave i18n do erro da leitura; null sem erro. */
  errorKey: string | null;
  /** Lê de novo mostrando o carregamento (ex.: após erro). */
  reload: () => void;
  /** Lê de novo em segundo plano (ex.: após pedir a assinatura). */
  refresh: () => void;
}
