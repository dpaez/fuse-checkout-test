# checkout-test

NOTE: be sure to have enabled fuse on your daemon: `hyperdrive fuse-setup`

## Usage

1. clone it
2. npm i
3. `node index.js`

OR

using provided Dockerfile
1. `docker build -t checkout-test:0.1 .`
2. `docker run --rm --cap-add SYS_ADMIN --device /dev/fuse checkout-test:0.1`

## Expected

- output: `COOL :)`

## Current result

- output: `OH NO - fail`

## Goal

Using fuse, checkout a drive (related to one specific mountpoint) and be capable of read the content of a file.
