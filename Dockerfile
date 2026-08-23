FROM node:lts-alpine AS builder

# Baked into the bundle: the SPA has no server to read env from at runtime.
# Only the initial fallback — the app rescans the LAN for the device on every load.
ARG PUBLIC_POS_URL=""
ENV PUBLIC_POS_URL=$PUBLIC_POS_URL
ARG PUBLIC_POS_TIMEOUT_MS=""
ENV PUBLIC_POS_TIMEOUT_MS=$PUBLIC_POS_TIMEOUT_MS

WORKDIR /app

COPY . ./

RUN npm ci --ignore-scripts
RUN npm run build


# --------

FROM alpine:3.24

ARG PB_VERSION=0.40.0

RUN apk add --no-cache ca-certificates unzip wget \
	&& wget -q -O /tmp/pb.zip "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip" \
	&& unzip -q /tmp/pb.zip pocketbase -d /usr/local/bin/ \
	&& rm /tmp/pb.zip

COPY pb_migrations /pb/pb_migrations
COPY pb_hooks /pb/pb_hooks
COPY --from=builder /app/pb_public /pb/pb_public

EXPOSE 8090

CMD [ "pocketbase", "serve", "--http=0.0.0.0:8090", \
	"--dir=/pb/pb_data", "--migrationsDir=/pb/pb_migrations", \
	"--hooksDir=/pb/pb_hooks", "--publicDir=/pb/pb_public" ]
