import type { ContractActionHandlers } from "@/hooks/useContractActions";
import type { ContractEntry } from "@/types/contracts";

export interface ContractCardProps extends ContractActionHandlers {
  entry: ContractEntry;
  locale: string;
}
