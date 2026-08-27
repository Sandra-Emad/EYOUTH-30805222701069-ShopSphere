FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --ignore-scripts

COPY . .

RUN DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ecommerce_db1" npx prisma generate

EXPOSE 5000

CMD ["npm", "start"]