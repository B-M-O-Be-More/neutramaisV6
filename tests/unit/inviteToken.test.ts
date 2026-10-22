import { describe, expect, it } from "vitest";

import { readInviteToken } from "@/functions/inviteToken";

const TOKEN = "Xy3_k-9QpLm2vNb8RtZaWc4dEfGh1JkL0oPqRsTuVwY";

describe("readInviteToken", () => {
  it("lê o token do link do e-mail, descartando o /change-password", () => {
    expect(readInviteToken(`#token=${TOKEN}/change-password`)).toBe(TOKEN);
  });

  it("lê o token sem sufixo e sem o #", () => {
    expect(readInviteToken(`#token=${TOKEN}`)).toBe(TOKEN);
    expect(readInviteToken(`token=${TOKEN}`)).toBe(TOKEN);
  });

  it("ignora outros parâmetros do fragmento", () => {
    expect(readInviteToken(`#lang=pt&token=${TOKEN}&x=1`)).toBe(TOKEN);
  });

  it("devolve null sem token ou com caracteres fora do token_urlsafe", () => {
    expect(readInviteToken("")).toBeNull();
    expect(readInviteToken("#section")).toBeNull();
    expect(readInviteToken("#token=")).toBeNull();
    expect(readInviteToken("#token=<script>")).toBeNull();
    expect(readInviteToken("#mytoken=abc")).toBeNull();
  });
});
