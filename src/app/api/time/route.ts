import { NextResponse } from 'next/server'

export async function GET() {
  const now = new Date()
  
  return NextResponse.json({
    utc: now.toISOString(),
    local: now.toString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timestamp: now.getTime()
  })
} 