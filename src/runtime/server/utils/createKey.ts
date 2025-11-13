type CreateKeyArgs = {
  ipAddress: string
  prefix?: string
  path?: string
}

/**
 * Builds a namespaced storage key for rate-limiting operations.
 *
 * @param options - Object containing key generation parameters.
 * @returns A formatted storage key string.
 */
const createKey = (options: CreateKeyArgs) => {
  const args = Object.assign({}, {
    prefix: 'ip',
  }, options)

  if (args.path) {
    return `${args.prefix}:${args.path}:${args.ipAddress}`
  }

  return `${args.prefix}:${args.ipAddress}`
}

export default createKey
