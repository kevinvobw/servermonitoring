# Use Node.js image as base
FROM node:20

# Set the working directory inside the container
WORKDIR /app

# Install ping utility (iputils-ping)
RUN apt-get update && apt-get install -y iputils-ping

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Expose the port the app will run on
EXPOSE 3000

# Command to run the application
CMD ["node", "monitoring.js"]
