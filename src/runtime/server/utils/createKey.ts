type CreateKeyArgs = {
  ipAddress: string
  prefix?: string
  path?: string
}

const createKey = (options: CreateKeyArgs) => {
  const args = Object.assign({}, {
    prefix: 'ip',
  }, options)

  const sanitizedIP = args.ipAddress.replace(/:/g, '_')

  if (args.path) {
    return `${args.prefix}:${args.path}:${sanitizedIP}`
  }

  return `${args.prefix}:${sanitizedIP}`
}

export default createKey
