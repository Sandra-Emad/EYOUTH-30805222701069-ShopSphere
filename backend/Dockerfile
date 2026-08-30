FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --ignore-scripts

COPY . .

# Prisma only needs a syntactically valid DATABASE_URL during client generation.
# Production DATABASE_URL is provided securely by the hosting platform.
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" npx prisma generate

EXPOSE 5000

CMD ["npm", "start"]