FROM node:16

WORKDIR /app

# Use apt-get instead of apk for Debian-based images
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm install

# Now, copy the entire application source code
COPY . .

# If needed, modify User.ts
RUN sed -i 's/\bbcrypt\b/bcryptjs/g' src/models/User.ts

# Build the TypeScript code
RUN npm run build

# Add wait-for-it script
ADD https://github.com/vishnubob/wait-for-it/raw/master/wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

# Wait for database and start the app
CMD ["/bin/bash", "-c", "/wait-for-it.sh postgres:5432 -t 60 -- node dist/index.js"]