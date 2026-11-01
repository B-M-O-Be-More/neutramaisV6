import type {
  Contract,
  ContractChangeRequest,
  ContractsSummary,
} from "@/types/contracts";

export interface UseContractsReturn {
  contracts: Contract[];
  summary: ContractsSummary;
  /** Momento da leitura, base dos prazos ("renova em 6d"). */
  now: number;
  /** Contrato com ação em andamento; null quando nenhum. */
  pendingId: string | null;
  /** Liga ou desliga a renovação automática. */
  toggleAutoRenew: (id: string) => Promise<boolean>;
  /** Envia o pedido de aditivo ao seller; null se negado. */
  requestAmendment: (
    id: string,
    description: string,
  ) => Promise<ContractChangeRequest | null>;
  /** Pede o cancelamento (com a multa vigente); false se já pedido. */
  requestCancellation: (id: string) => Promise<boolean>;
}
