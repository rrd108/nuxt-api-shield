import { defineEventHandler, getRouterParam } from 'h3'

export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path')
  
  if (path?.endsWith('summary')) {
    if (path.startsWith('monthly/')) {
      return { result: 'Report Summary' }
    }
    if (path.startsWith('annual/')) {
      return { result: 'Annual Report Summary' }
    }
    if (path.startsWith('quarterly/')) {
      return { result: 'Quarterly Report Summary' }
    }
  }
  
  return { result: 'Report' }
})
