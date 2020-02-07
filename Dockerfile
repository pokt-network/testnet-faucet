FROM node:11.6

# Create app directory
WORKDIR /usr/src/app

# Copy files
COPY . .

# Install dependencies
RUN npm run build

# Run application
CMD [ "node", "index.js" ]