import { NextResponse } from 'next/server'
import { sendNotifications } from '../../../../lib/notification';

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  console.log('Running notification cron job...')

  await sendNotifications()

  console.log('Notification cron job completed')

  return NextResponse.json({ success: true })
}