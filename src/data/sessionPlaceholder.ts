// Contadores do design, compartilhados pelas páginas da área autenticada até
// existir o endpoint de pendências. O usuário já vem da sessão (GET /me —
// ver SessionContext).
export const PLACEHOLDER_BADGES = {
  proposals: 3,
  disputes: 1,
  tickets: 2,
  receivedOrders: 5,
  receivedRfqs: 2,
  sellerTickets: 3,
};
