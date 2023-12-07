FROM node:18-alpine as builder

RUN mkdir /node-app
WORKDIR /node-app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

EXPOSE ${PORT}

CMD ["yarn", "start"]