FROM rust:slim-bookworm AS builder
WORKDIR /app
COPY ssh/Cargo.toml ssh/Cargo.lock ./ssh/
COPY ssh/src ./ssh/src
COPY ssh/build.rs ./ssh/
COPY content ./content
RUN cargo build --release --manifest-path ssh/Cargo.toml

FROM debian:bookworm-slim
COPY --from=builder /app/ssh/target/release/omeraydin-ssh /usr/local/bin/omeraydin-ssh
EXPOSE 22
CMD ["/usr/local/bin/omeraydin-ssh"]
