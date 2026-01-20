# Build stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Build with baseHref set to / for root domain deployment
RUN npm run build -- --base-href=/

# Production stage
FROM nginx:alpine
# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copy built assets from build stage
COPY --from=build /app/docs /usr/share/nginx/html
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
