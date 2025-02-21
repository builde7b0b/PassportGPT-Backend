FROM node:18
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
RUN npm install

# Copy only necessary files
COPY src/ ./src/
COPY server.js ./

EXPOSE 3001
CMD ["node", "server.js"]