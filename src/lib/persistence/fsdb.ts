import fs from 'node:fs/promises'
import path from 'node:path'

const DATA_DIR = path.join(process.cwd(), '.data')

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true })
}

export async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  const abs = path.isAbsolute(filePath) ? filePath : path.join(DATA_DIR, filePath)
  await ensureDir(path.dirname(abs))
  await fs.writeFile(abs, JSON.stringify(data, null, 2), 'utf8')
}

export async function readJsonFile<T>(filePath: string): Promise<T | null> {
  const abs = path.isAbsolute(filePath) ? filePath : path.join(DATA_DIR, filePath)
  try {
    const raw = await fs.readFile(abs, 'utf8')
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function fileExists(filePath: string): Promise<boolean> {
  const abs = path.isAbsolute(filePath) ? filePath : path.join(DATA_DIR, filePath)
  try {
    await fs.stat(abs)
    return true
  } catch {
    return false
  }
}

export async function listFiles(dirPath: string): Promise<string[]> {
  const abs = path.isAbsolute(dirPath) ? dirPath : path.join(DATA_DIR, dirPath)
  try {
    const entries = await fs.readdir(abs)
    return entries.map((e) => path.join(abs, e))
  } catch {
    return []
  }
}

export function dataPath(rel: string): string {
  return path.join(DATA_DIR, rel)
}


