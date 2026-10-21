"use client";

import React from "react";

import {
  KYC_MAX_FILE_BYTES,
  KYC_MIME_TYPES,
  kycService,
  type KycDocumentType,
  type KycLevelSupported,
  type KycMimeType,
} from "@/services/kyc.service";

import type { KycDocumentState, UseKycDocumentsResult } from "./interface";

const isKycMimeType = (type: string): type is KycMimeType =>
  (KYC_MIME_TYPES as readonly string[]).includes(type);

/**
 * Envio de documentos na etapa de KYC (Figma 1920-18413).
 *
 * Cada arquivo escolhido é enviado na hora: `POST /kyc/artifacts` (multipart)
 * devolve o id do artefato confirmado, guardado por documento. No fim, `submit`
 * manda os ids do nível escolhido para `POST /kyc/submit`. Trocar um arquivo
 * substitui o id daquele documento, então a seleção nunca leva duas versões do
 * mesmo documento.
 *
 * Erros são tratados aqui (SDD §12.4) e reduzidos a uma chave de tradução.
 */
export function useKycDocuments(
  organizationId?: string,
): UseKycDocumentsResult {
  const [documents, setDocuments] = React.useState<
    UseKycDocumentsResult["documents"]
  >({});
  const [submitting, setSubmitting] = React.useState(false);

  const patch = (type: KycDocumentType, next: Partial<KycDocumentState>) =>
    setDocuments((prev) => ({
      ...prev,
      [type]: { status: "idle", ...prev[type], ...next },
    }));

  const upload = async (
    documentType: KycDocumentType,
    level: KycLevelSupported,
    file: File,
  ) => {
    if (!isKycMimeType(file.type)) {
      patch(documentType, { error: "Register.flow.kyc.errors.mimeType" });
      return;
    }
    if (file.size > KYC_MAX_FILE_BYTES) {
      patch(documentType, { error: "Register.flow.kyc.errors.fileSize" });
      return;
    }
    if (!organizationId) {
      patch(documentType, {
        error: "Register.flow.kyc.errors.missingOrganization",
      });
      return;
    }

    patch(documentType, { status: "uploading", error: undefined });
    try {
      const artifact = await kycService.uploadArtifact(organizationId, {
        document_type: documentType,
        kyc_level_supported: level,
        file,
      });
      // Sem id não há o que mandar para o /kyc/submit — conta como falha.
      if (!artifact?.id) throw new Error("Resposta do /kyc/artifacts sem id");

      patch(documentType, {
        status: "sent",
        artifactId: artifact.id,
        fileName: file.name,
      });
    } catch {
      // Uma troca que falha mantém o artefato anterior válido.
      setDocuments((prev) => ({
        ...prev,
        [documentType]: {
          ...prev[documentType],
          status: prev[documentType]?.artifactId ? "sent" : "idle",
          error: "Register.flow.kyc.errors.upload",
        },
      }));
    }
  };

  const artifactIds = Object.values(documents).flatMap((doc) =>
    doc?.artifactId ? [doc.artifactId] : [],
  );

  const submit = async (documentTypes: KycDocumentType[]) => {
    const ids = documentTypes.flatMap((type) => {
      const id = documents[type]?.artifactId;
      return id ? [id] : [];
    });
    if (!organizationId || ids.length === 0) return false;

    setSubmitting(true);
    try {
      await kycService.submit(organizationId, ids);
      return true;
    } catch {
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const uploading = Object.values(documents).some(
    (doc) => doc?.status === "uploading",
  );

  return { documents, artifactIds, uploading, submitting, upload, submit };
}
