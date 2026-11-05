import { renderHook } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useObjectUrl } from "@/hooks/useObjectUrl";

describe("useObjectUrl", () => {
  let created: string[];
  let revoked: string[];

  beforeEach(() => {
    vi.useFakeTimers();
    created = [];
    revoked = [];
    URL.createObjectURL = vi.fn(() => {
      const url = `blob:test-${created.length + 1}`;
      created.push(url);
      return url;
    });
    URL.revokeObjectURL = vi.fn((url: string) => {
      revoked.push(url);
    });
  });

  afterEach(() => vi.useRealTimers());

  it("no StrictMode, a URL exibida continua válida (a prévia não quebra)", () => {
    const file = new File(["png"], "capa.png", { type: "image/png" });

    const { result } = renderHook(() => useObjectUrl(file), {
      wrapper: React.StrictMode,
    });
    vi.runAllTimers();

    expect(result.current).toMatch(/^blob:/);
    expect(revoked).not.toContain(result.current);
  });

  it("revoga ao trocar de arquivo e ao desmontar", () => {
    const first = new File(["a"], "a.png", { type: "image/png" });
    const second = new File(["b"], "b.png", { type: "image/png" });

    const { result, rerender, unmount } = renderHook(
      ({ file }) => useObjectUrl(file),
      { initialProps: { file: first as File | null } },
    );
    const firstUrl = result.current;

    rerender({ file: second });
    vi.runAllTimers();
    expect(revoked).toEqual([firstUrl]);
    expect(result.current).not.toBe(firstUrl);

    const secondUrl = result.current;
    unmount();
    vi.runAllTimers();
    expect(revoked).toEqual([firstUrl, secondUrl]);
  });

  it("sem arquivo, sem URL", () => {
    const { result } = renderHook(() => useObjectUrl(null));
    expect(result.current).toBeNull();
    expect(created).toEqual([]);
  });
});
