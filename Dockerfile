FROM node:20.11.0-alpine as builder

WORKDIR /app
COPY . ./

COPY .env.%ENVFILE_NEXT% ./.env
RUN yarn install
RUN yarn build

FROM node:20.11.0-alpine as dst

WORKDIR /app

COPY --from=builder /app .

EXPOSE 3000
CMD ["yarn","start"]
