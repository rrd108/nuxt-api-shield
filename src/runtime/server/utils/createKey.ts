type CreateKeyArgs = {
  ipAddress: string
  prefix?: string
  path?: string
  /** The configurable `storageKeyPrefix`, prepended to the whole key. */
  storageKeyPrefix?: string
}

const createKey = (options: CreateKeyArgs) => {
  const args = Object.assign({}, {
    prefix: 'ip',
  }, options)

  const sanitizedIP = args.ipAddress.replace(/:/g, '_')
  const prefix = `${args.storageKeyPrefix ?? ''}${args.prefix}`

  if (args.path) {
    return `${prefix}:${args.path}:${sanitizedIP}`
  }

  return `${prefix}:${sanitizedIP}`
}

export default createKey
