export interface UseContractDocumentReturn {
  /** PDF lido; null enquanto carrega, sem documento ou em falha. */
  blob: Blob | null;
  /** URL `blob:` do PDF para a prévia. */
  url: string | null;
  /**
   * true: o SHA-256 do arquivo bate com o `documentHash`. false: não bate.
   * null: ainda não conferido (ou navegador sem Web Crypto).
   */
  isVerified: boolean | null;
  isLoading: boolean;
  /** Chave i18n do erro da leitura; null sem erro. */
  errorKey: string | null;
  reload: () => void;
}
