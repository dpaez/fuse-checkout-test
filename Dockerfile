FROM mhart/alpine-node:12

ARG USER=default

RUN apk upgrade --no-cache -U && \
  apk add --no-cache curl make gcc g++ python linux-headers binutils-gold gnupg libstdc++ libtool autoconf automake

RUN apk --update add fuse fuse-dev git bash util-linux;

RUN set -ex && apk --no-cache add sudo

WORKDIR checkout-test

COPY . .

# RUN cd sdk

RUN npm install

RUN echo "Running daemon fuse-setup"
RUN ./node_modules/hyperdrive-daemon/bin/run/run fuse-setup;

CMD node index.js
