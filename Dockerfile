FROM node:lts-alpine

RUN mkdir /app
WORKDIR /app

COPY . /app

RUN npm ci

EXPOSE 5173