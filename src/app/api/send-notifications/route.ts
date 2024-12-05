import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST() {
  try {
    const today = new Date()
    const threeDaysFromNow = new Date(today.setDate(today.getDate() + 3))
    
    // This would normally come from your database
    const expiringItems = [
      {
        item: "Milk",
        expiryDate: "2024-03-20",
        email: "user@example.com"
      }
    ]

    for (const item of expiringItems) {
      const itemDate = new Date(item.expiryDate)
      
      if (itemDate.toDateString() === threeDaysFromNow.toDateString()) {
        await resend.emails.send({
          from: 'Fresh Track <notifications@freshtrack.com>',
          to: item.email,
          subject: `🚨 ${item.item} is expiring soon!`,
          html: `
            <h1>Expiring Food Alert</h1>
            <p>Your ${item.item} will expire on ${item.expiryDate}.</p>
            <p>Remember to use it soon to avoid food waste!</p>
          `
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send notifications' }, { status: 500 })
  }
} 