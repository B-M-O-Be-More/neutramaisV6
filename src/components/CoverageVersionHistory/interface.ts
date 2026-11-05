import type { ReactNode } from "react";

import type { CoverageGeometryStats } from "@/functions/coverageGeometryStats";

/** Uma versão do arquivo como o histórico a mostra. */
export interface CoverageVersionHistoryItem {
  versionId: string;
  /** Posição no histórico: v1 é a primeira enviada. */
  number: number;
  /** Nome do KMZ (lembrado no navegador) ou "KMZ {id}". */
  label: string;
  createdAt: string;
  isActive: boolean;
  /** Tamanho do original, quando já foi baixado. */
  sizeBytes?: number;
  /** Contagens, quando o KMZ já foi lido. */
  stats?: CoverageGeometryStats | null;
  offerCount: number;
}

export interface CoverageVersionHistoryProps {
  /** Da versão mais recente para a mais antiga. */
  items: CoverageVersionHistoryItem[];
  /** Idioma das datas e tamanhos (ex.: "pt-BR"). */
  locale: string;
  /** Dono com o arquivo ativo: pode trocar a versão ativa. */
  canManage: boolean;
  /** Versão sendo restaurada. */
  restoringId?: string | null;
  /** Versão cujo original está sendo baixado. */
  downloadingId?: string | null;
  onRestore: (versionId: string) => void;
  onDownload: (item: CoverageVersionHistoryItem) => void;
  /** Ação de excluir, na linha da versão atual (a lixeira com confirmação). */
  archiveAction?: ReactNode;
}
