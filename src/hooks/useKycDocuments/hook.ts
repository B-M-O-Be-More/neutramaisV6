"use client";

import React from "react";

import {
  KYC_MAX_BYTES,
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
 * Cada arquivo escolhido vira um artefato após upload e confirmação:
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
  const submittingRef = React.useRef(false);
  const versions = React.useRef<Partial<Record<KycDocumentType, number>>>({});
  const activeUploads = React.useRef(0);
  const [uploadCount, setUploadCount] = React.useState(0);

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
    if (submittingRef.current) return;
    const version = (versions.current[documentType] ?? 0) + 1;
    versions.current[documentType] = version;
    const fail = (error: string) =>
      setDocuments((prev) => {
        if (versions.current[documentType] !== version) return prev;
        return {
          ...prev,
          [documentType]: {
            ...prev[documentType],
            status: prev[documentType]?.artifactId ? "sent" : "idle",
            error,
          },
        };
      });
    if (!isKycMimeType(file.type)) {
      fail("Register.flow.kyc.errors.mimeType");
      return;
    }
    if (file.size === 0 || file.size > KYC_MAX_BYTES) {
      fail("Register.flow.kyc.errors.fileSize");
      return;
    }
    if (!organizationId) {
      fail("Register.flow.kyc.errors.missingOrganization");
      return;
    }

    patch(documentType, { status: "uploading", error: undefined });
    activeUploads.current += 1;
    setUploadCount(activeUploads.current);
    try {
      const artifact = await kycService.uploadArtifact(
        organizationId,
        {
          document_type: documentType,
          kyc_level_supported: level,
          mime_type: file.type,
          size_bytes: file.size,
        },
        file,
      );
      // Só artefatos confirmados com id podem ser enviados para análise.
      const artifactId = artifact?.artifact_id ?? artifact?.id;
      if (!artifactId) throw new Error("KYC confirmation missing id");
      if (versions.current[documentType] !== version) return;

      patch(documentType, {
        status: "sent",
        artifactId,
        fileName: file.name,
      });
    } catch {
      // Uma troca que falha mantém o artefato anterior válido.
      fail("Register.flow.kyc.errors.upload");
    } finally {
      activeUploads.current -= 1;
      setUploadCount(activeUploads.current);
    }
  };

  const artifactIds = Object.values(documents).flatMap((doc) =>
    doc?.artifactId ? [doc.artifactId] : [],
  );

  const submit = async () => {
    if (
      !organizationId ||
      artifactIds.length === 0 ||
      activeUploads.current > 0 ||
      submittingRef.current
    )
      return false;

    submittingRef.current = true;
    setSubmitting(true);
    try {
      await kycService.submit(organizationId, artifactIds);
      return true;
    } catch {
      return false;
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const uploading = uploadCount > 0;

  return { documents, artifactIds, uploading, submitting, upload, submit };
}
