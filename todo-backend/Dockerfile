FROM node:18-alpine

WORKDIR /app
COPY app/package.json .
COPY app/index.js .
RUN npm install

CMD ["node", "index.js"]

