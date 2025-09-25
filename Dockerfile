FROM node:20-alpine

WORKDIR /Live-Doc-Patient

COPY . .

RUN npm install

RUN npm run build

EXPOSE 8012

CMD ["npm", "run", "start"]
