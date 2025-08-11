FROM node:24.5.0-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY config .

EXPOSE 3016

CMD ["node", "index.js"]
