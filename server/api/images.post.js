import { writeFile } from 'fs/promises'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  const form = await readMultipartFormData(event)
  const file = form.find(f => f.name === 'image')
  const filePath = `/images/${Date.now()}_${file.filename}`
  const fullPath = join(process.cwd(), 'public', filePath)
  await writeFile(fullPath, file.data)
  return { url: filePath }
})