FROM node:22 AS build
WORKDIR /app
COPY package-lock.json package-lock.json
COPY src src
COPY vite.config.ts vite.config.ts
COPY package.json package.json
COPY tsconfig.json tsconfig.json
RUN npm install --ignore-scripts
EXPOSE 5173
CMD ["npx", "vite", "--host=0.0.0.0"]
