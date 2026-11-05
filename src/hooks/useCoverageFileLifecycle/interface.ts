export type CoverageLifecycleResult =
  | { ok: true }
  | { ok: false; /** Chave de tradução do erro. */ errorKey: string };

export interface UseCoverageFileLifecycleReturn {
  /** Versão sendo restaurada, ou "archive" enquanto arquiva. */
  pending: string | null;
  /** "Usar esta versão": torna ativa uma versão retida do arquivo. */
  restore: (
    versionId: string,
    expectedRevision: string,
  ) => Promise<CoverageLifecycleResult>;
  /**
   * Exclui (arquiva) o arquivo. Com ofertas vinculadas, `replacementFileId`
   * é o arquivo ativo que passa a atendê-las.
   */
  archive: (
    expectedRevision: string,
    replacementFileId?: string,
  ) => Promise<CoverageLifecycleResult>;
}
