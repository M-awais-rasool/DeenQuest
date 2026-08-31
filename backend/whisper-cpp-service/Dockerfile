ARG WHISPER_CPP_REF=v1.7.4

FROM debian:bookworm-slim AS build
ARG WHISPER_CPP_REF

RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential cmake git ca-certificates \
      libavcodec-dev libavformat-dev libavutil-dev libswresample-dev \
 && rm -rf /var/lib/apt/lists/*

RUN git clone --depth 1 --branch "${WHISPER_CPP_REF}" \
      https://github.com/ggml-org/whisper.cpp /src

WORKDIR /src

RUN cmake -B build \
      -DCMAKE_BUILD_TYPE=Release \
      -DBUILD_SHARED_LIBS=OFF \
      -DWHISPER_FFMPEG=yes \
      -DWHISPER_BUILD_TESTS=OFF \
      -DWHISPER_BUILD_EXAMPLES=ON \
 && cmake --build build -j"$(nproc)" --target whisper-server

FROM debian:bookworm-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
      ffmpeg \
 && rm -rf /var/lib/apt/lists/*

COPY --from=build /src/build/bin/whisper-server /usr/local/bin/whisper-server

# Non-root, and the rootfs is mounted read-only at runtime.
RUN useradd --system --uid 10001 --no-create-home whisper
USER 10001:10001

WORKDIR /tmp

EXPOSE 8001

ENTRYPOINT ["/usr/local/bin/whisper-server"]
CMD ["--host", "0.0.0.0", \
     "--port", "8001", \
     "--model", "/models/quran-base-ggml.bin", \
     "--language", "ar", \
     "--threads", "2", \
     "--convert"]
