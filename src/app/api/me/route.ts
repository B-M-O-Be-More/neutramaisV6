import { forwardToIdentity } from "@/server/identityProxy";

// BFF: GET /api/me → identity-api GET /me
// Perfil do usuário autenticado (organização, papéis, permissões, MFA). O
// Bearer sai do cookie httpOnly (access_token); sem sessão válida o upstream
// responde 401/403 e o status volta verbatim para o cliente decidir entre
// renovar o token ou mandar para o login.
export async function GET() {
  return forwardToIdentity({ method: "GET", path: "/me" });
}
