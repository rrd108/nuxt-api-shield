import { access, appendFile, mkdir } from 'node:fs/promises'
import type { RateLimit } from '../types/RateLimit'
import type { LogEntry } from '../types/LogEntry'
import { useRuntimeConfig } from '#imports'

const shieldLog = async (req: RateLimit, requestIP: string, url: string) => {
  const options = useRuntimeConfig().public.nuxtApiShield

  if (!options.log.path || !options.log.attempts) {
    return
  }

  // console.log(`shieldLog(${req}, ${requestIP}, ${url})`);
  if ((options.log as LogEntry).attempts && req.count >= (options.log as LogEntry).attempts) {
    const logLine = `${requestIP} - (${req.count}) - ${new Date(
      req.time,
    ).toISOString()} - ${url}\n`

    const date = new Date().toISOString().split('T')[0].replace(/-/g, '')

    try {
      await access((options.log as LogEntry).path)
      await appendFile(`${(options.log as LogEntry).path}/shield-${date}.log`, logLine)
    }
    catch (error: unknown) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        await mkdir((options.log as LogEntry).path)
        await appendFile(`${(options.log as LogEntry).path}/shield-${date}.log`, logLine)
      }
      else {
        console.error('Unexpected error:', error)
        // Handle other potential errors
      }
    }
  }
}

export default shieldLog
