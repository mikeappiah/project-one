FROM node

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

ARG PORT=3000

ENV PORT=$PORT

EXPOSE $PORT

CMD ["npm","start"]