FROM node:22 AS build
WORKDIR /app
COPY package-lock.json package-lock.json
COPY src src
COPY vite.config.ts vite.config.ts
COPY package.json package.json
COPY tsconfig.json tsconfig.json
COPY index.html index.html
COPY mime.types mime.types
COPY nginx.conf nginx.conf
RUN npm install --ignore-scripts
RUN npm run build

FROM docker.io/nginx:1.24
RUN rm -rf /usr/share/nginx/html/*
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/mime.types /usr/share/nginx/html
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 443
CMD ["nginx", "-g", "daemon off;"]
