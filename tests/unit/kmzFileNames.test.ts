import { beforeEach, describe, expect, it, vi } from "vitest";

import { kmzFileName, rememberKmzFileName } from "@/functions/kmzFileNames";
import { mergeVersions } from "@/functions/mergeCoverageVersions";
import type { CoverageVersionSummary } from "@/services/geoCoverage.service";

const version = (id: string, extra: Partial<CoverageVersionSummary> = {}) => ({
  id,
  organizationId: "org",
  predecessorId: null,
  sourceSha256: "a".repeat(64),
  createdAt: "2026-10-28T12:00:00Z",
  logicalFileId: `file-${id}`,
  originalAvailable: true,
  metadataAvailable: true,
  ...extra,
});

describe("kmzFileNames", () => {
  beforeEach(() => localStorage.clear());

  it("lembra o nome do arquivo por versão", () => {
    rememberKmzFileName("v1", "KMZ Geral.kmz");

    expect(kmzFileName("v1")).toBe("KMZ Geral.kmz");
    expect(kmzFileName("v2")).toBeUndefined();
  });

  it("guarda só os 200 mais recentes", () => {
    for (let index = 0; index < 201; index += 1) {
      rememberKmzFileName(`v${index}`, `${index}.kmz`);
    }

    expect(kmzFileName("v0")).toBeUndefined();
    expect(kmzFileName("v200")).toBe("200.kmz");
  });

  it("sem storage (ou com lixo nele), segue sem o nome", () => {
    localStorage.setItem("neutramais.kmzFileNames", "{quebrado");
    expect(kmzFileName("v1")).toBeUndefined();

    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });
    expect(() => rememberKmzFileName("v1", "a.kmz")).not.toThrow();
    setItem.mockRestore();
  });
});

describe("mergeVersions", () => {
  it("usa a versão enviada na sessão no lugar da listada e põe as novas no topo", () => {
    const listed = [version("a"), version("b")];
    const uploaded = [
      { version: version("c", { fileName: "novo.kmz" }) },
      { version: version("b", { fileName: "b.kmz", polygonCount: 4 }) },
    ];

    expect(
      mergeVersions(uploaded, listed).map((item) => [item.id, item.fileName]),
    ).toEqual([
      ["c", "novo.kmz"],
      ["a", undefined],
      ["b", "b.kmz"],
    ]);
  });
});
