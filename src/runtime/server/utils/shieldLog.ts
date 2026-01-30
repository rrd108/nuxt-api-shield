import { appendFile, mkdir } from 'node:fs/promises'
import type { RateLimit } from '../types/RateLimit'
import type { LogEntry } from '../types/LogEntry'

/**
 * Formats a log line for the shield log.
 */
const formatLogLine = (req: RateLimit, requestIP: string, url: string): string => {
  return `${requestIP} - (${req.count}) - ${new Date(req.time).toISOString()} - ${url}\n`
}

/**
 * Generates the log filename based on current date.
 */
const getLogFilename = (): string => {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '')
  return `shield-${date}.log`
}

/**
 * Logs rate limit attempts to a file if configured.
 */
const shieldLog = async (req: RateLimit, requestIP: string, url: string, logConfig?: LogEntry) => {
  if (!logConfig?.path || !logConfig?.attempts) {
    return
  }

  if (req.count < logConfig.attempts) {
    return
  }

  const logLine = formatLogLine(req, requestIP, url)
  const fileName = getLogFilename()
  const filePath = `${logConfig.path}/${fileName}`

  try {
    // Ensure directory exists
    await mkdir(logConfig.path, { recursive: true })
    await appendFile(filePath, logLine)
  }
  catch (error: unknown) {
    // Using console.error as a fallback if file logging fails
    console.error('[nuxt-api-shield] Failed to write log:', error)
  }
}

export default shieldLog
