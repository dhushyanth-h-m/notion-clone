FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

RUN npm install react-router-dom @types/react-router-dom --save


COPY . .

EXPOSE 3000
CMD ["npm", "start"]