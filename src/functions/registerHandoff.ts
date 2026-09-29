/**
 * Handoff do fluxo de cadastro através do round-trip do e-mail de confirmação.
 *
 * O link de confirmação chega no e-mail e é aberto tipicamente em OUTRA aba —
 * às vezes em outro navegador. O estado do stepper (RegisterFlowContext) e os
 * valores do formulário vivem em memória e morrem nesse pulo, então guardamos o
 * mínimo necessário para retomar o cadastro na etapa seguinte.
 *
 * Por que `localStorage` e não `sessionStorage`: sessionStorage é por aba, e a
 * aba aberta pelo cliente de e-mail é sempre uma nova — não veria nada.
 *
 * O que é guardado: id da organização (já público na resposta do register), o
 * e-mail e o telefone digitados, em que etapa parar e o token do link de
 * confirmação. Nenhuma senha. O token é de uso único e já foi consumido pelo
 * `GET /auth/confirm-email` no momento em que chega aqui — além de estar na URL
 * (e no histórico) de todo modo.
 */

const STORAGE_KEY = "neutramais:register-handoff";

export interface RegisterHandoff {
  /** Id da organização criada pelo register. */
  organizationId: string;
  /** E-mail que recebeu o link — exibido na etapa de verificação. */
  email: string;
  /** Telefone (E.164) que recebe o SMS — exibido na etapa de verificação. */
  phone?: string;
  /** Etapa em que o formulário deve ser retomado. */
  step: number;
  /** Vira true quando o link do e-mail é confirmado com sucesso. */
  emailConfirmed: boolean;
  /**
   * Id do usuário-raiz. Só é conhecido quando o link do e-mail é aberto (vem na
   * query do link) — é a credencial que identifica o usuário na confirmação do
   * telefone, que acontece sem sessão.
   */
  userId?: string;
  /**
   * Token de confirmação vindo na query do link do e-mail. Guardado no momento
   * em que a landing confirma o e-mail, para ficar disponível ao restante do
   * fluxo (que roda em outra aba, sem os parâmetros da URL original).
   */
  token?: string;
  /** Vira true quando o OTP do telefone é confirmado com sucesso. */
  phoneConfirmed?: boolean;
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function saveRegisterHandoff(handoff: RegisterHandoff): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(handoff));
  } catch {
    // Modo privado / cota cheia: seguimos sem retomada — o usuário cai na tela
    // de sucesso do confirm-email com CTA para o login.
  }
}

export function readRegisterHandoff(): RegisterHandoff | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<RegisterHandoff>;
    // Valida o shape: storage é entrada não-confiável (pode ter sido escrito por
    // uma versão anterior do app ou editado à mão).
    if (
      typeof parsed.organizationId !== "string" ||
      typeof parsed.email !== "string" ||
      typeof parsed.step !== "number"
    ) {
      return null;
    }

    return {
      organizationId: parsed.organizationId,
      email: parsed.email,
      phone: typeof parsed.phone === "string" ? parsed.phone : undefined,
      step: parsed.step,
      emailConfirmed: parsed.emailConfirmed === true,
      userId: typeof parsed.userId === "string" ? parsed.userId : undefined,
      token: typeof parsed.token === "string" ? parsed.token : undefined,
      phoneConfirmed: parsed.phoneConfirmed === true,
    };
  } catch {
    return null;
  }
}

/**
 * Zera o armazenamento do navegador e grava um handoff novo com o que veio no
 * link do e-mail. Chamado quando o `GET /auth/confirm-email` responde 200.
 *
 * Por que limpar tudo e não só mesclar: o link costuma ser aberto num navegador
 * que já carrega estado de um cadastro anterior (ou de outra conta), e é esse
 * resquício que faz a tela alegar coisas erradas. O que ainda interessa —
 * organização e e-mail, quando havia um cadastro em andamento AQUI — é relido
 * antes da limpeza e reaproveitado.
 *
 * Efeito colateral aceito: preferências guardadas no localStorage (tema, idioma)
 * voltam ao padrão. Os cookies são responsabilidade do BFF, que os reseta na
 * mesma resposta do confirm-email.
 */
export function resetRegisterHandoff(link: {
  userId: string;
  token: string;
  step: number;
}): RegisterHandoff {
  const previous = readRegisterHandoff();

  if (isBrowser()) {
    try {
      window.localStorage.clear();
    } catch {
      // Modo privado / storage bloqueado: segue com o handoff em memória.
    }
  }

  const handoff: RegisterHandoff = {
    organizationId: previous?.organizationId ?? "",
    email: previous?.email ?? "",
    phone: previous?.phone,
    step: link.step,
    emailConfirmed: true,
    userId: link.userId || previous?.userId,
    token: link.token || previous?.token,
    phoneConfirmed: false,
  };

  saveRegisterHandoff(handoff);
  return handoff;
}

/**
 * Marca o telefone como confirmado. Não mexe na etapa: o telefone é opcional e
 * quem avança o fluxo é o botão "Finalizar cadastro".
 */
export function confirmPhoneHandoff(): void {
  const handoff = readRegisterHandoff();
  if (!handoff) return;

  saveRegisterHandoff({ ...handoff, phoneConfirmed: true });
}

/** Atualiza só a etapa em que o cadastro deve ser retomado. */
export function advanceRegisterHandoff(nextStep: number): void {
  const handoff = readRegisterHandoff();
  if (!handoff) return;

  saveRegisterHandoff({ ...handoff, step: nextStep });
}

export function clearRegisterHandoff(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignorado — nada a fazer se o storage não coopera.
  }
}
