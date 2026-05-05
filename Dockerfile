# Build Stage
FROM node:alpine AS build

WORKDIR /app

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Cache dependencies
COPY package*.json ./
RUN npm ci --quiet

# Build the project with Vite public environment variables baked into the static app.
COPY . .
RUN npm run build

# Serve Stage (Nginx)
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
