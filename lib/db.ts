import fs from 'fs'
import path from 'path'
import { ExpiryItem } from './types'

const DB_PATH = path.join(process.cwd(), 'data', 'items.json')

export const saveItem = async (item: ExpiryItem) => {
  let items: ExpiryItem[] = []
  
  if (fs.existsSync(DB_PATH)) {
    const data = fs.readFileSync(DB_PATH, 'utf-8')
    items = JSON.parse(data)
  }

  items.push(item)
  fs.writeFileSync(DB_PATH, JSON.stringify(items, null, 2))
}

export const getItems = async (): Promise<ExpiryItem[]> => {
  if (!fs.existsSync(DB_PATH)) return []
  
  const data = fs.readFileSync(DB_PATH, 'utf-8')
  return JSON.parse(data)
} 