# Use the official Node.js image
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Install Angular CLI globally
RUN npm install -g @angular/cli

# Copy package.json and package-lock.json first (to cache dependencies)
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps --force --no-audit

# Copy the rest of the Angular project files
COPY . .

# Expose the Angular default port
EXPOSE 4200

# Start the Angular app in development mode with hot reloading
CMD ["ng", "serve", "--host", "0.0.0.0", "--port", "4200"]
