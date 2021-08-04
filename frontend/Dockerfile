FROM node:16 AS build
WORKDIR /app/frontend
ADD package.json package-lock.json /app/frontend/
RUN npm i
ADD archive-frontend.tar /app/frontend
RUN npm run build

FROM nginx:alpine
ADD nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/build /usr/share/nginx/html
