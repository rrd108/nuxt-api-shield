/**
 * Checks if a stored ban timestamp is in the past.
 * @param bannedUntilRaw The raw value retrieved from storage, expected to be a timestamp.
 * @returns True if the ban is expired or data is malformed, false otherwise.
 */
export const isActualBanTimestampExpired = (bannedUntilRaw: unknown): boolean => {
  if (bannedUntilRaw === null || bannedUntilRaw === undefined) {
    // Consider null/undefined entries as invalid/expired for cleanup
    return true
  }
  const numericTimestamp = Number(bannedUntilRaw)
  if (Number.isNaN(numericTimestamp)) {
    // Malformed data, treat as expired for cleanup
    return true
  }
  // Ban is expired if current time is greater than or equal to the stored timestamp
  return Date.now() >= numericTimestamp
}
