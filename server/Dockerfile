FROM node:16-alpine

# Install dependencies required for bcrypt
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./

# Remove existing bcrypt and install bcryptjs instead (more portable)
RUN npm uninstall bcrypt || true
RUN npm install
RUN npm install bcryptjs
RUN npm install --save-dev @types/bcryptjs

COPY . .

# Update User.ts to use bcryptjs instead
RUN sed -i 's/bcrypt/bcryptjs/g' src/models/User.ts

EXPOSE 5001
CMD ["npm", "run", "dev"]