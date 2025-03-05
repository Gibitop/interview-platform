FROM ghcr.io/gibitop/interview-platform-insider-node:latest

USER root

RUN apk add --no-cache openjdk21 gradle

USER node
