const {promises:{writeFile}} = require('fs')
const {join} = require('path')
const { once } = require('events')
const { HyperdriveClient } = require('hyperdrive-daemon-client')
const constants = require('hyperdrive-daemon-client/lib/constants')
const HyperdriveDaemonManager = require('hyperdrive-daemon/manager')

const localdht = require('./dht')

const delay = async (ms) => {
  await new Promise(resolve => setTimeout(resolve, ms))
}

const connect = async (opts={}) => {
  const finalOpts = {...constants, ...opts}
  finalOpts.storage = constants.root

  let client
  const endpoint = `localhost:${finalOpts.port}`
  try {
    const clientPromise = new HyperdriveClient({
      endpoint,
      token: finalOpts.token,
      storage: finalOpts.storage
    })
    await clientPromise.ready()
    console.log('startDaemon: found instance already running')
    client = clientPromise
  } catch (err) {
    console.log('startDaemon: no instance running found, waking up a new one...')
    await HyperdriveDaemonManager.start(finalOpts)

    const cReady = async () => {
      client = new HyperdriveClient({
        endpoint,
        token: finalOpts.token,
        storage: finalOpts.storage
      })
      await client.ready()
      return client
    }

    await delay(1000)

    client = await cReady()
  }

  return client
}

const demo = async () => {

  const opts = {}
  const { url, node } = await localdht()
  opts.bootstrap = url
  opts.noAnnounce = true

  const client1 = await connect({...opts })
  const client2 = await connect({...opts })

  try {
    // mount root
    await client1.fuse.mount()
  } catch (_) {}

  const dir1 = join(constants.mountpoint, 'mountpoint1')

  try {
    await client1.fuse.mount(dir1)
  } catch (_) {}

  const mountpath = join(dir1, 'drive1')
  let key
  try { 
    const {mountInfo} = await client1.fuse.mount(mountpath) 
    key = mountInfo.key
  } catch (_) {
    const mountInfo = await client1.fuse.info(mountpath)
    key = mountInfo.key
  }
  
  console.log('key', key.toString('hex'))

  const drive1 = await client1.drive.get({key})

  await writeFile(join(dir1,'drive1','index.json'), 'hola mundo')
  const mirror1 = client1.drive.import(join(dir1,'drive1'), drive1)

  await once(mirror1, 'put-end')
  console.log('file mirrored OK')

  await delay(500)
  const version = await drive1.version()
  const ls = await drive1.readdir('/')
  console.log({ls})

  // checkout drive1 with latest version
  const drive1Checkout = await client2.drive.get({key, version})

  const ls2 = await drive1Checkout.readdir('/')
  console.log('checkout readdir', ls2)
  const out = await drive1Checkout.readFile('index.json', { encoding: 'utf8' })

  if (out === 'hola mundo') {
    console.log('COOL :)')
  } else {
    console.log('OH NO - FAIL')
  }

  try {
  console.log('destroying instances...')
  await drive1.close()
  await drive1Checkout.close()
  await node.destroy()
  await HyperdriveDaemonManager.stop()
  process.exit(0)
  } catch (err) {
    console.log('Problems terminating demo', err)
  }
}

demo()
  .then(console.log('running'))
  .catch(console.error)
