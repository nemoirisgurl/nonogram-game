# Build Stage
FROM node:20-alpine AS build

WORKDIR /app

# Cache dependencies
COPY package*.json ./
RUN npm ci --quiet

# Build the project using BuildKit secrets to safely access VITE_ variables
COPY . .
RUN --mount=type=secret,id=VITE_SUPABASE_URL \
    --mount=type=secret,id=VITE_SUPABASE_ANON_KEY \
    VITE_SUPABASE_URL=$(cat /run/secrets/VITE_SUPABASE_URL) \
    VITE_SUPABASE_ANON_KEY=$(cat /run/secrets/VITE_SUPABASE_ANON_KEY) \
    npm run build

# Serve Stage (Nginx)
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
