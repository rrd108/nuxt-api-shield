import { appendFile, mkdir } from 'node:fs/promises'
import type { RateLimit } from '../types/RateLimit'
import type { LogEntry } from '../types/LogEntry'
import type { LimitConfiguration } from '../../type'

const buffer: string[] = []
let flushTimer: ReturnType<typeof setInterval> | null = null
let logPathPrefix = ''
let dirInitialized = false

const formatLogLine = (req: RateLimit, requestIP: string, url: string): string => {
  return `${requestIP} - (${req.count}) - ${new Date(req.time).toISOString()} - ${url}\n`
}

const formatFail2banLine = (requestIP: string, url: string, limit: LimitConfiguration): string => {
  const now = new Date()
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')},${String(now.getMilliseconds()).padStart(3, '0')}`
  return `${timestamp} nuxt-api-shield ban ${requestIP} — ${url} exceeded limit (${limit.max} requests in ${limit.duration}s)\n`
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

const initDir = async (logConfig: LogEntry) => {
  if (dirInitialized) return true
  dirInitialized = true
  logPathPrefix = logConfig.path
  try {
    await mkdir(logConfig.path, { recursive: true })
  }
  catch (error: unknown) {
    console.error('[nuxt-api-shield] Failed to create log directory:', error)
    return false
  }
  if (!flushTimer) {
    flushTimer = setInterval(flush, 5000)
    flushTimer.unref?.()
  }
  return true
}

const shieldLog = async (req: RateLimit, requestIP: string, url: string, logConfig?: LogEntry) => {
  if (!logConfig?.path || !logConfig?.attempts) {
    return
  }

  if (req.count < logConfig.attempts) {
    return
  }

  if (!(await initDir(logConfig))) return

  buffer.push(formatLogLine(req, requestIP, url))
}

export const shieldLogBan = async (
  requestIP: string,
  url: string,
  limit: LimitConfiguration,
  logConfig?: LogEntry,
) => {
  if (!logConfig?.path || !logConfig?.fail2ban) {
    return
  }

  if (!(await initDir(logConfig))) return

  buffer.push(formatFail2banLine(requestIP, url, limit))
}

export default shieldLog
