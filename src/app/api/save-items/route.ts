import { NextRequest, NextResponse } from 'next/server'
import { saveItem } from '../../../../lib/db'
import { v4 as uuidv4 } from 'uuid'
import { ExpiryItem } from '../../../../lib/types'

export async function POST(request: NextRequest) {
  try {
    const { items, email }: { items: ExpiryItem[], email: string } = await request.json()

    for (const [item, details] of Object.entries(items)) {
      await saveItem({
        id: uuidv4(),
        item,
        expiryDate: details.expiryDate,
        email,
        notificationSent: false
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
