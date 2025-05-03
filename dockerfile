# 1. Base image
FROM node:18

# 2. Set working directory
WORKDIR /app

# 3. Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# 4. Copy the rest of the app
COPY . .

# 5. Expose a port (required by Cloud Run)
EXPOSE 8080

# 6. Start the bot
CMD ["node", "bot.js"]
