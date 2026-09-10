// Stub de `server-only` para os testes.
//
// O pacote não existe em node_modules: quem o resolve é o bundler do Next, que o
// usa só como marcador para barrar o import de um módulo server-side a partir de
// um Client Component. Sob o Vitest não há esse bundler, então os módulos de
// servidor (identityProxy, authCookies) não importariam. Aqui ele vira um módulo
// vazio — o marcador não tem comportamento em runtime.
export {};
