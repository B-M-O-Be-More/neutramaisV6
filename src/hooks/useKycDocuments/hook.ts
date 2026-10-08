"use client";

import React from "react";

import { sha256Hex } from "@/functions/fileHash";
import {
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
 * Envio de documentos na etapa de KYC do cadastro (Figma 1920-18413).
 *
 * Cada arquivo escolhido vira um artefato na hora: `POST /kyc/artifacts`
 * devolve um `artifact_id`, guardado por documento. No fim, `submit` manda a
 * lista de ids para `POST /kyc/submit`. Trocar um arquivo substitui o id daquele
 * documento, então o lote nunca leva duas versões do mesmo documento.
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
        // Provisório: ainda não há upload para o S3, então vai o nome do arquivo.
        s3_reference: file.name,
        content_hash: await sha256Hex(file),
        mime_type: file.type,
      });
      patch(documentType, {
        status: "sent",
        artifactId: artifact.artifact_id,
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

  const submit = async () => {
    if (!organizationId || artifactIds.length === 0) return false;

    setSubmitting(true);
    try {
      await kycService.submit(organizationId, artifactIds);
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
