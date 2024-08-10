FROM node:22.6.0-alpine3.20

WORKDIR /usr/src/app

ENV ENVIRONMENT=DOCKER

RUN apk add --no-cache chromium

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

CMD ["node", "build/main.js"]