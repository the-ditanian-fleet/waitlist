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
RUN wget https://www.fuzzwork.co.uk/dump/sqlite-latest.sqlite.bz2
RUN bzip2 -d sqlite-latest.sqlite.bz2
RUN sqlite3 minimum.sqlite " \
    attach 'sqlite-latest.sqlite' as ext; \
    create table invTypes as select * from ext.invTypes; \
    create index invTypes_name on invTypes (typeName); \
    create index invTypes_typeID on invTypes (typeID); \
    create table invGroups as select * from ext.invGroups; \
    create index invGroups_groupID on invGroups (groupID); \
"

FROM python:3.6
ADD api/requirements.txt /app/api/
WORKDIR /app/api
RUN pip install -r requirements.txt
COPY --from=1 /data/minimum.sqlite /app/api/sqlite-latest.sqlite
COPY --from=0 /app/frontend/build/static /app/api/waitlist/static/
COPY --from=0 /app/frontend/build/index.html /app/api/waitlist/static/
ADD archive-api.tar /app

EXPOSE 5000
CMD python main.py