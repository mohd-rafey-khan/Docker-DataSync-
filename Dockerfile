FROM node:18

WORKDIR /app

COPY . /app/

RUN npm i

CMD [ "npm", "start" ]