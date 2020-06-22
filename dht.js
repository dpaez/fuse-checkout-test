const { once } = require('events');
const dht = require('@hyperswarm/dht')

const BOOTSTRAP_PORT = 3301
const BOOTSTRAP_URL = `localhost:${BOOTSTRAP_PORT}`

/*
 * In memory DHT
 * Goal: speed up tests by avoiding to announce everything to the real DHT
 * and reducing network usage this way.
 * To do this, we create a local in-memory DHT node that we can
 * quickly query in our tests.
 */

const bootstrapServer = async () => {
  const bootstrapper = dht({
    bootstrap: false
  })
  bootstrapper.listen(BOOTSTRAP_PORT)
  await once(bootstrapper, 'listening')
  return {
    node: bootstrapper,
    url: [BOOTSTRAP_URL]
  }
}

module.exports = bootstrapServer
