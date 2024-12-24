import { NextRequest, NextResponse } from 'next/server'
import { saveItem } from '../../../../lib/db'
import { ExpiryItem } from '../../../../lib/types'
import { Resend } from 'resend'
import { formatDate } from '../../../../lib/util'

const resend = new Resend(process.env.RESEND_API_KEY)

const capitalizeFirstLetter = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

export async function POST(request: NextRequest) {
  try {
    const { items, email }: { items: ExpiryItem[], email: string } = await request.json()

    // Save all items first
    for (const item of items) {
      const { code, name, expiryDate, purchaseDate, category, storageType, notes } = item
      await saveItem({
        code,
        name,
        expiryDate,
        purchaseDate,
        email,
        category,
        storageType,
        notes
      })
    }

    // Send confirmation email
    const response = await resend.emails.send({
      from: 'Fresh Track <notifications@dylanklein.dev>',
      to: email,
      subject: '🎉 Expiry Tracking Enabled Successfully',
      html: `
        <h1>Your Items Are Being Tracked!</h1>
        <p>You'll receive notifications 3 days before any items expire. Here's a summary of the items we're tracking for you:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Category</th>
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Storage</th>
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Expires</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => {
              const purchaseDate = new Date(item.purchaseDate)
              const expiryDate = new Date(item.expiryDate)
              const today = new Date()
              const totalDays = Math.ceil(
                (expiryDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24)
              )
              const daysElapsed = Math.ceil(
                (today.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24)
              )
              const daysRemaining = totalDays - daysElapsed
              
              let bgColor
              if (daysRemaining < 0) {
                bgColor = '#fee2e2' // Light red for expired
              } else if (daysRemaining < 7) {
                bgColor = '#fef3c7' // Light yellow for expiring soon
              } else {
                bgColor = '#dcfce7' // Light green for good
              }

              return `
                <tr style="background-color: ${bgColor};">
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${capitalizeFirstLetter(item.category)}</td>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${capitalizeFirstLetter(item.storageType)}</td>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                    ${formatDate(item.expiryDate)}
                    ${daysRemaining < 0 
                      ? ' (Expired)'
                      : daysRemaining < 7 
                        ? ` (${daysRemaining} days left)`
                        : ''
                    }
                  </td>
                </tr>
              `
            }).join('')}
          </tbody>
        </table>
        
        <p style="color: #6b7280; font-size: 0.875rem; margin-top: 40px;">
          If you didn't request this, please ignore this email.
          Have any feedback? Email me at dylan@dylanklein.dev
        </p>
      `,
      text: `Your Items Are Being Tracked!

You'll receive notifications 3 days before any items expire. Here's a summary of the items we're tracking for you:

${items.map(item => {
  const purchaseDate = new Date(item.purchaseDate)
  const expiryDate = new Date(item.expiryDate)
  const today = new Date()
  const totalDays = Math.ceil(
    (expiryDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24)
  )
  const daysElapsed = Math.ceil(
    (today.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24)
  )
  const daysRemaining = totalDays - daysElapsed
  
  const status = daysRemaining < 0 
    ? '(Expired)'
    : daysRemaining < 7 
      ? `(${daysRemaining} days left)`
      : ''

  return `
- ${item.name} (${capitalizeFirstLetter(item.category)})
  Stored: ${capitalizeFirstLetter(item.storageType)}
  Expires: ${formatDate(item.expiryDate)} ${status}`
}).join('\n')}

If you didn't request this, please ignore this email.
Have any feedback? Email me at dylan@dylanklein.dev`
    })

    if (response.error) {
      console.error('Failed to send confirmation email:', response.error)
      return NextResponse.json(
        { error: 'Items saved but failed to send confirmation email' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in save-items route:', error)
    return NextResponse.json(
      { error: 'Failed to save items' },
      { status: 500 }
    )
  }
}
