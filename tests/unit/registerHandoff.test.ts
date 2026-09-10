import { beforeEach, describe, expect, it } from "vitest";

import {
  readRegisterHandoff,
  resetRegisterHandoff,
  saveRegisterHandoff,
} from "@/functions/registerHandoff";

const TOKEN = "OhDmalA75QBiUyCdpxPuhtkEgzTCsyyLr4XYBHEdGAA.2580fc67";
const USER_ID = "019fee5d-e152-7380-9fc0-800f08cf6d7e";
const VERIFY_STEP = 4;

describe("resetRegisterHandoff", () => {
  beforeEach(() => localStorage.clear());

  it("zera o localStorage e grava o que veio no link", () => {
    // Resquícios de uma sessão anterior no mesmo navegador.
    localStorage.setItem("neutramais:algo-antigo", "1");
    saveRegisterHandoff({
      organizationId: "org-antiga",
      email: "antigo@empresa.com",
      step: 0,
      emailConfirmed: false,
      userId: "usuario-antigo",
      phoneConfirmed: true,
    });

    resetRegisterHandoff({ userId: USER_ID, token: TOKEN, step: VERIFY_STEP });

    expect(localStorage.getItem("neutramais:algo-antigo")).toBeNull();

    const handoff = readRegisterHandoff();
    expect(handoff).toMatchObject({
      step: VERIFY_STEP,
      emailConfirmed: true,
      userId: USER_ID,
      token: TOKEN,
      phoneConfirmed: false,
    });
    // Organização e e-mail do cadastro em andamento são reaproveitados: o link
    // não os carrega, e sem eles o KYC ficaria sem dono.
    expect(handoff?.organizationId).toBe("org-antiga");
    expect(handoff?.email).toBe("antigo@empresa.com");
  });

  it("funciona sem cadastro anterior — link aberto em outro navegador", () => {
    resetRegisterHandoff({ userId: USER_ID, token: TOKEN, step: VERIFY_STEP });

    const handoff = readRegisterHandoff();
    expect(handoff).toMatchObject({
      organizationId: "",
      email: "",
      step: VERIFY_STEP,
      emailConfirmed: true,
      userId: USER_ID,
      token: TOKEN,
    });
  });
});
