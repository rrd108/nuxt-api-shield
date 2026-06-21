import { appendFile, mkdir } from 'node:fs/promises'
import type { RateLimit } from '../types/RateLimit'
import type { LogEntry } from '../types/LogEntry'

const buffer: string[] = []
let flushTimer: ReturnType<typeof setInterval> | null = null
let logPathPrefix = ''
let dirInitialized = false

const formatLogLine = (req: RateLimit, requestIP: string, url: string): string => {
  return `${requestIP} - (${req.count}) - ${new Date(req.time).toISOString()} - ${url}\n`
}

const getLogFilename = (): string => {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '')
  return `shield-${date}.log`
}

const flush = async () => {
  if (buffer.length === 0 || !logPathPrefix) return
  const lines = buffer.splice(0)
  try {
    await appendFile(`${logPathPrefix}/${getLogFilename()}`, lines.join(''))
  }
  catch (error: unknown) {
    console.error('[nuxt-api-shield] Failed to write log:', error)
  }
}

const shieldLog = async (req: RateLimit, requestIP: string, url: string, logConfig?: LogEntry) => {
  if (!logConfig?.path || !logConfig?.attempts) {
    return
  }

  if (req.count < logConfig.attempts) {
    return
  }

  if (!dirInitialized) {
    dirInitialized = true
    logPathPrefix = logConfig.path
    try {
      await mkdir(logConfig.path, { recursive: true })
    }
    catch (error: unknown) {
      console.error('[nuxt-api-shield] Failed to create log directory:', error)
      return
    }
    if (!flushTimer) {
      flushTimer = setInterval(flush, 5000)
      flushTimer.unref?.()
    }
  }

  buffer.push(formatLogLine(req, requestIP, url))
}

export default shieldLog
