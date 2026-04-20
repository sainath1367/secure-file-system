FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --no-optional

COPY app.js .

RUN mkdir -p /app/keys /app/encrypted /app/decrypted

CMD ["node", "app.js"]
