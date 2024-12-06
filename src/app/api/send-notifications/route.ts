import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { getItems } from '../../../../lib/db'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST() {
  console.log('Sending notifications')
  try {
    const today = new Date()
    const threeDaysFromNow = new Date(today.setDate(today.getDate() + 3))
    
    const expiringItems = await getItems();

    for (const item of expiringItems) {
      const itemDate = new Date(item.expiryDate)
      
      if (itemDate.toDateString() === threeDaysFromNow.toDateString()) {
        const response = await resend.emails.send({
          from: 'Fresh Track <onboarding@resend.dev>',
          to: item.email,
          subject: `🚨 ${item.item} is expiring soon!`,
          html: `
            <h1>Expiring Food Alert</h1>
            <p>Your ${item.item} is estimated to expire on ${item.expiryDate}.</p>
            <p>Remember to use it soon to avoid food waste!</p>
          `
        })
        if (!response.error) {
          console.log(`Notification sent to ${item.email} for ${item.item}`);
        } else {
          console.error(`Failed to send notification to ${item.email} for ${item.item}: ${response.error}`);
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send notifications' }, { status: 500 })
  }
} 