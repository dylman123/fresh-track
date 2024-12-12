import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 })
    }

    console.log('Running notification cron job...')
    
    const response = await fetch(`${process.env.VERCEL_URL}/api/send-notifications`, {
      method: 'POST',
    })

    console.log('Notification cron job completed: ', response)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cron job failed:', error)
    return NextResponse.json({ error: 'Failed to run cron job' }, { status: 500 })
  }
}