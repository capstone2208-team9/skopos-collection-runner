FROM node:18-alpine as base
RUN apk update 

WORKDIR /home/collection-runner

COPY . .

RUN npm install

RUN npm run build

EXPOSE 3003

CMD ["node", "dist/index.js"]