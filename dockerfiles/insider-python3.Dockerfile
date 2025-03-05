FROM ghcr.io/gibitop/interview-platform-insider-node:latest

USER root

ENV PYTHONUNBUFFERED=1
RUN apk add --update --no-cache python3 py3-pip py3-setuptools
RUN ln -sf python3 /usr/bin/python

USER node
