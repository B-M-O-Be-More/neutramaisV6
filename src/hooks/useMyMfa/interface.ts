import type { MyMfaStatus } from "@/services/myMfa.service";

export interface UseMyMfaReturn {
  /** null enquanto carrega ou em erro. */
  status: MyMfaStatus | null;
  isLoading: boolean;
  /** Chave de tradução quando o status não carregou. */
  error: string | null;
  reload: () => void;
}
