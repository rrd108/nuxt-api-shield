import { defineEventHandler } from 'h3'

export default defineEventHandler(async () => {
  return { result: 'Special Admin Data' }
})
