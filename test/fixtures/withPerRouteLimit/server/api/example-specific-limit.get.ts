import { defineEventHandler } from 'h3'

export default defineEventHandler(async () => {
  return { id: 2, name: 'Radha' }
})
