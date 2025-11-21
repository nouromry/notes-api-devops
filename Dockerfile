# Use a small Node.js base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the source code
COPY . .

# Expose port
EXPOSE 3000

# Start the Node.js app
CMD ["npm", "start"]
