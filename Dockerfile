# SmartHR360 frontend — multi-stage, non-root (same hardening convention as the services)
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund
COPY . .
# Service URLs are baked at build time (NEXT_PUBLIC_*). Override with --build-arg.
# They must be reachable from the BROWSER, hence localhost host-port defaults.
ARG NEXT_PUBLIC_AUTH_URL=http://localhost:8000
ARG NEXT_PUBLIC_CORE_HR_URL=http://localhost:8001
ARG NEXT_PUBLIC_CAREER_SIM_URL=http://localhost:8003
ARG NEXT_PUBLIC_FUTURE_SKILLS_URL=http://localhost:8004
ARG NEXT_PUBLIC_WORKLOAD_URL=http://localhost:8005
ARG NEXT_PUBLIC_POLICY_GEN_URL=http://localhost:8006
ARG NEXT_PUBLIC_RETENTION_URL=http://localhost:8007
ENV NEXT_PUBLIC_AUTH_URL=$NEXT_PUBLIC_AUTH_URL \
    NEXT_PUBLIC_CORE_HR_URL=$NEXT_PUBLIC_CORE_HR_URL \
    NEXT_PUBLIC_CAREER_SIM_URL=$NEXT_PUBLIC_CAREER_SIM_URL \
    NEXT_PUBLIC_FUTURE_SKILLS_URL=$NEXT_PUBLIC_FUTURE_SKILLS_URL \
    NEXT_PUBLIC_WORKLOAD_URL=$NEXT_PUBLIC_WORKLOAD_URL \
    NEXT_PUBLIC_POLICY_GEN_URL=$NEXT_PUBLIC_POLICY_GEN_URL \
    NEXT_PUBLIC_RETENTION_URL=$NEXT_PUBLIC_RETENTION_URL
RUN npm run build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production PORT=3100 HOSTNAME=0.0.0.0
RUN addgroup -S app && adduser -S app -G app
# Standalone output: a minimal server (server.js) + only the traced deps.
# No 458 MB node_modules copy. Static assets are shipped separately.
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
USER app
EXPOSE 3100
CMD ["node", "server.js"]
