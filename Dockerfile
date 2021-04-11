FROM node:14
ADD frontend/package.json frontend/package-lock.json /app/frontend/
WORKDIR /app/frontend
RUN npm i
ADD archive-frontend.tar /app
RUN npm run build

FROM alpine
RUN apk add sqlite wget bzip2
RUN mkdir /data
WORKDIR /data
ADD api/shrink-sde.sh /data/
RUN sh shrink-sde.sh

FROM python:3.6
ADD api/requirements.txt /app/api/
WORKDIR /app/api
RUN pip install -r requirements.txt
COPY --from=1 /data/sqlite-shrunk.sqlite /app/api/sqlite-shrunk.sqlite
COPY --from=0 /app/frontend/build/static /app/api/waitlist/static/
COPY --from=0 /app/frontend/build/index.html /app/frontend/build/favicon.ico /app/api/waitlist/static/
ADD archive-api.tar /app

EXPOSE 5000
CMD python main.py