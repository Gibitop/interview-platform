FROM ghcr.io/gibitop/interview-platform-insider-node:latest

USER root

COPY --from=golang:1.24.0-alpine /usr/local/go/ /usr/local/go/
ENV PATH="/usr/local/go/bin:${PATH}"

USER node
