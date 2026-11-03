import { describe, expect, it } from "vitest";

import { INVOICE_PDF_MAX_BYTES, readInvoicePdf } from "@/functions/pdfFile";

const pdf = (body: string, name = "nf.pdf") =>
  new File([body], name, { type: "application/pdf" });

describe("leitura do PDF da NF", () => {
  it("devolve o Base64 de um PDF com %PDF- e %%EOF", async () => {
    const content = "%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF\n";

    await expect(readInvoicePdf(pdf(content))).resolves.toEqual({
      base64: btoa(content),
    });
  });

  it("recusa arquivo que não começa com %PDF-", async () => {
    await expect(
      readInvoicePdf(pdf("<html>%%EOF</html>", "nf.html")),
    ).resolves.toEqual({ error: "notPdf" });
  });

  it("recusa PDF sem %%EOF no fim", async () => {
    await expect(readInvoicePdf(pdf("%PDF-1.7\n1 0 obj"))).resolves.toEqual({
      error: "notPdf",
    });
  });

  it("recusa acima de 2 MiB sem ler o arquivo", async () => {
    const big = new File(["x"], "nf.pdf");
    Object.defineProperty(big, "size", { value: INVOICE_PDF_MAX_BYTES + 1 });

    await expect(readInvoicePdf(big)).resolves.toEqual({ error: "tooLarge" });
  });
});
