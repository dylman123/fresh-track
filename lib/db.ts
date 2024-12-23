import { Pool } from 'pg'
import { ExpiryItem } from './types'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL as string,
  ssl: {
    rejectUnauthorized: false
  }
})

export const saveItem = async (item: ExpiryItem) => {
  const query = `
    INSERT INTO items (code, name, expiry_date, email, category, storage_type, notes)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `
  const values = [item.code, item.name, item.expiryDate, item.email, item.category, item.storageType, item.notes]
  
  await pool.query(query, values)
}

export const getItems = async (): Promise<ExpiryItem[]> => {
  const result = await pool.query(`
    SELECT 
      code,
      name,
      expiry_date as "expiryDate",
      email,
      category,
      storage_type as "storageType",
      notes
    FROM items
  `)
  
  return result.rows
} 