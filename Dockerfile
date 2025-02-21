FROM node:18
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
RUN npm install

# Copy only the necessary files
COPY server.js ./
COPY .env ./

EXPOSE 3001
CMD ["node", "server.js"]
