FROM node:18-bullseye-slim as base
RUN apt-get update

WORKDIR /home/collection-runner

COPY . .

RUN npm install

RUN npm run build

EXPOSE 3003

CMD ["node", "dist/index.js"]