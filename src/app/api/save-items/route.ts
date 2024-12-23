import { NextRequest, NextResponse } from 'next/server'
import { saveItem } from '../../../../lib/db'
import { ExpiryItem } from '../../../../lib/types'

export async function POST(request: NextRequest) {
  try {
    const { items, email }: { items: ExpiryItem[], email: string } = await request.json()

    for (const item of items) {
      const { code, name, expiryDate, category, storageType, notes } = item
      await saveItem({
        code,
        name,
        expiryDate,
        email,
        category,
        storageType,
        notes
      })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Failed to save items' },
      { status: 500 }
    )
  }
}
