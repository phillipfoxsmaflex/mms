FROM node:21.6.1 AS build

WORKDIR /usr/src/app
COPY package*.json ./

# Configure npm for better network resilience
RUN npm config set registry https://registry.npmjs.org/

# Uncomment the following lines if you're behind a corporate proxy
# RUN npm config set proxy http://your-proxy-server:port && \
#     npm config set https-proxy http://your-proxy-server:port

# Install dependencies with better network handling
RUN NODE_OPTIONS="--max_old_space_size=4096" npm install --legacy-peer-deps --prefer-offline --no-audit --no-fund
COPY . .
RUN npm run build

FROM nginx:1.27.0-alpine
COPY --from=build /usr/src/app/build /usr/share/nginx/html
COPY --from=build /usr/src/app/.env.example /usr/share/nginx/html/.env
COPY --from=build /usr/src/app/nginx-custom.conf /etc/nginx/conf.d/default.conf

RUN apk add --update nodejs
RUN apk add --update npm

RUN npm i -g runtime-env-cra

WORKDIR /usr/share/nginx/html
EXPOSE 3000

CMD ["/bin/sh", "-c", "runtime-env-cra && nginx -g \"daemon off;\""]

