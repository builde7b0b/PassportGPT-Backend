FROM node:18
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
RUN npm install

# Copy server file
COPY server.js ./

EXPOSE 3001
CMD ["node", "server.js"]
