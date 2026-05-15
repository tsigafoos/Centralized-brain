# Build stage
FROM rust:1.75 as builder

WORKDIR /app

# Copy manifest files
COPY Cargo.toml Cargo.lock ./

# Copy source code
COPY src ./src

# Build release binary
RUN cargo build --release

# Runtime stage
FROM debian:bookworm-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

# Copy binary from builder
COPY --from=builder /app/target/release/centralized-brain ./

# Create data directory
RUN mkdir -p ./data/models

# Expose port
EXPOSE 9000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:9000/health || exit 1

# Environment defaults
ENV SERVER_HOST=0.0.0.0
ENV SERVER_PORT=9000
ENV INFERENCE_MODE=cloud
ENV OPENAI_ENDPOINT=http://127.0.0.1:8001
ENV STORAGE_PATH=/app/data

# Run the application
CMD ["./centralized-brain"]
