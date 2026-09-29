# ==========================
# STAGE 1 - Build
# ==========================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install

COPY . .

# As variáveis NEXT_PUBLIC_* são embutidas no bundle do browser durante o build,
# não lidas em runtime. Passe a site key como build-arg
# (`docker build --build-arg NEXT_PUBLIC_HCAPTCHA_SITE_KEY=<uuid>`); defini-la
# apenas no ambiente do container NÃO tem efeito.
ARG NEXT_PUBLIC_HCAPTCHA_SITE_KEY=""
ENV NEXT_PUBLIC_HCAPTCHA_SITE_KEY=$NEXT_PUBLIC_HCAPTCHA_SITE_KEY

RUN npm run build

# ==========================
# STAGE 2 - Runtime
# ==========================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
