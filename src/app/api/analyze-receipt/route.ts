import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const receipt = formData.get('receipt') as File
    
    const today = new Date().toISOString().split('T')[0]
    const bytes = await receipt.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = buffer.toString('base64')

    const detailedPrompt = `Today's date is ${today}. This is a grocery receipt. Please analyze the items and provide estimated expiry dates based on these guidelines:

Fresh Produce:
- Leafy greens: 5-7 days when refrigerated
- Berries: 3-5 days when refrigerated
- Citrus fruits: 2-3 weeks when refrigerated
- Bananas: 5-7 days at room temperature
- Root vegetables: 2-3 weeks when refrigerated
- Fresh herbs: 7-10 days when refrigerated

Dairy Products:
- Milk: 7-10 days after opening
- Yogurt: 1-2 weeks after opening
- Hard cheese: 3-4 weeks after opening
- Soft cheese: 1-2 weeks after opening
- Eggs: 4-5 weeks when refrigerated

Meat and Seafood:
- Fresh fish: 1-2 days when refrigerated
- Ground meat: 1-2 days when refrigerated
- Whole cuts of meat: 3-5 days when refrigerated
- Deli meats: 3-5 days after opening

Pantry Items:
- Bread: 5-7 days at room temperature
- Chips/Crackers: 1-2 weeks after opening
- Cereal: 2-3 months after opening
- Canned goods: 3-5 days after opening when refrigerated

Please return the response as a JSON object with this structure:
{
  "itemName": {
    "expiryDate": "YYYY-MM-DD",
    "category": "produce|dairy|meat|pantry",
    "storageType": "refrigerated|room temperature|frozen",
    "notes": "Optional storage or handling tips"
  }
}

Base all expiry dates on today's date (${today}) as the purchase date.`

    const message = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: detailedPrompt
            },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64Image
              }
            }
          ]
        }
      ]
    })

    // Parse the response
    const items = JSON.parse(message.content[0].text)

    // Sort items by expiry date
    const sortedItems = Object.entries(items)
      .sort(([, a], [, b]) => {
        const dateA = new Date(a.expiryDate)
        const dateB = new Date(b.expiryDate)
        return dateA.getTime() - dateB.getTime()
      })
      .reduce((acc, [key, value]) => ({
        ...acc,
        [key]: value
      }), {})

    return NextResponse.json(sortedItems)
  } catch (error) {
    console.error('Error processing receipt:', error)
    return NextResponse.json(
      { error: 'Failed to process receipt' },
      { status: 500 }
    )
  }
}