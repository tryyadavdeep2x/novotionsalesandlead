FROM node:20-slim

WORKDIR /app

COPY package*.json ./

RUN npm install
RUN npm install @tailwindcss/oxide-linux-x64-gnu || true

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
