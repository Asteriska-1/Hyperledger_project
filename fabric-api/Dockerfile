FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN chmod +x start.sh

EXPOSE 3000

CMD ["bash", "./start.sh"]

