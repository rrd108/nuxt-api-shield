import { defineEventHandler, getQuery } from 'h3'
import { runTask } from 'nitropack/runtime'

export default defineEventHandler(async (event) => {
  const { name } = getQuery(event)
  return await runTask(String(name))
})
