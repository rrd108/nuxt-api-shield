export interface LogEntry {
  path: string
  attempts: number
  fail2ban?: boolean
}
