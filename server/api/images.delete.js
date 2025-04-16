import { unlink } from 'fs/promises'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const fullPath = join(process.cwd(), 'public', body.url)
  await unlink(fullPath)
  return { success: true }
})