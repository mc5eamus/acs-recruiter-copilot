# Use an official Node.js runtime as the base image
FROM node:18-alpine as base

# Set the working directory in the container to /app
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the application dependencies
RUN npm install

RUN npm install -g serve

FROM base as dev

# Copy the rest of the application code to the working directory
COPY . .

RUN npm run build

RUN apk add --no-cache bash

# Expose port 3000 for the application
EXPOSE 3000

# Define the command to run the application
CMD echo "const API_BASE_URL = \"$API_BASE\";" > ./build/config.js; serve -s build