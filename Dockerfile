FROM node:lts as builder

WORKDIR /app

COPY . ./

RUN npm ci
RUN npm run build


# --------

FROM node:lts-alpine

COPY --from=builder /app/build/ /app
COPY --from=builder /app/package.json .
COPY --from=builder /app/node_modules node_modules/

EXPOSE 3000

ENTRYPOINT [ "node" ]
CMD [ "/app" ]
