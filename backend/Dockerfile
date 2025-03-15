FROM node

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

ARG PORT=3000

ENV PORT=$PORT

EXPOSE $PORT

CMD ["npm","start"]