# Static data
FROM alpine AS sde-export
RUN apk add sqlite wget bzip2
RUN mkdir /data
WORKDIR /data
ADD shrink-sde.sh /data/
RUN sh shrink-sde.sh


# Base image: have some deps etc
FROM rust:1.55-alpine AS base
WORKDIR /app/backend
RUN apk add --no-cache musl-dev sqlite
RUN cargo install cargo-chef


# Plan the build: create a list of dependencies
FROM base AS planner
ADD archive-backend.tar /app/backend
RUN cargo chef prepare --recipe-path /recipe.json


# Cache dependencies
FROM base AS cacher
COPY --from=planner /recipe.json /recipe.json
ARG DATABASE_ENGINE=sqlite
RUN cargo chef cook --release --no-default-features --features=${DATABASE_ENGINE} --recipe-path /recipe.json


# Build the image
FROM base AS builder
COPY --from=cacher /app/backend/target target
COPY --from=cacher $CARGO_HOME $CARGO_HOME
COPY --from=sde-export /data/sqlite-shrunk.sqlite sqlite-shrunk.sqlite
ADD archive-backend.tar /app/backend

RUN sqlite3 /wl-dev.sqlite < sql/sqlite.sql

ARG DATABASE_ENGINE=sqlite
ARG DATABASE_URL=${DATABASE_ENGINE}:/wl-dev.sqlite
RUN cargo build --release --no-default-features --features=${DATABASE_ENGINE}


# Final image
FROM alpine
COPY --from=sde-export /data/sqlite-shrunk.sqlite /tdf_wl/sqlite-shrunk.sqlite
COPY --from=builder /app/backend/target/release/tdf_wl /tdf_wl/bin
COPY --from=builder /wl-dev.sqlite /tdf_wl/wl-dev.sqlite

WORKDIR /tdf_wl
COPY data data
ADD Rocket.toml .

ENTRYPOINT /tdf_wl/bin
EXPOSE 5000
