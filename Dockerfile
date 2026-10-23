# Use official Node.js lightweight image
FROM node:18-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package.json and install dependencies
COPY backend/package.json ./backend/
RUN cd backend && npm install

# Copy the rest of the application code (backend and frontend)
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["node", "backend/server.js"]