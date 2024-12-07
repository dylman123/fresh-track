import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { getItems } from '../../../../lib/db'
import { ExpiryItem } from '../../../../lib/types'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST() {
  console.log('Sending notifications')
  try {
    const today = new Date()
    const threeDaysFromNow = new Date(today.setDate(today.getDate() + 3))
    
    const expiringItems = await getItems();
    const itemsToNotify = new Map<string, ExpiryItem[]>();

    for (const item of expiringItems) {
      const itemDate = new Date(item.expiryDate)
      
      if (itemDate.toDateString() === threeDaysFromNow.toDateString()) {
        const itemsForEmail = itemsToNotify.get(item.email) || [];
        itemsForEmail.push(item);
        itemsToNotify.set(item.email, itemsForEmail);
      }
    }

    for (const [email, items] of itemsToNotify) {
      const isOneItem = items.length === 1;
      const response = await resend.emails.send({
        from: 'Fresh Track <onboarding@resend.dev>',
        to: email,
        subject: `🚨 ${items[0].item}${isOneItem ? ' is' : ` and ${items.length - 1} other items are`} expiring soon!`,
        html: `
            <h1>Expiring Food Alert</h1>
            <p>The following items are expiring soon:</p>
            <ul>
              ${items.map(item => `<li>${item.item} - expires on ${item.expiryDate}</li>`).join('')}
            </ul>
            <p>Remember to use these items soon to avoid food waste!</p>
          `,
        text: `The following items are expiring soon:
${items.map(item => `- ${item.item} - expires on ${item.expiryDate}`).join('\n')}

Remember to use these items soon to avoid food waste!`
        })
        if (!response.error) {
          console.log(`Notification sent to ${email} for ${items.length} items`);
        } else {
        console.error(`Failed to send notification to ${email} for ${items.length} items: ${response.error}`);
      }
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to send notifications' }, { status: 500 })
  }
} 