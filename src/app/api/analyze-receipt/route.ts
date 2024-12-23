import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { ExpiryItem } from '../../../../lib/types'
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

    const detailedPrompt = `Today's date is ${today}. You are analyzing a grocery receipt. 

IMPORTANT INSTRUCTIONS:
1. Use EXACTLY the item code shown on the receipt (e.g., "ANGL 4PK PITA BREAD" not "ANGEL CIABATTA BREAD")
2. Analyze EVERY line item on the receipt - do not skip any items
3. If you can't determine what an item is, still include it with best-guess expiry dates
4. Maintain the exact format shown below
5. Return ONLY the JSON object with no additional text

For expiry dates, use these guidelines:

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

Return the response as an array of JSON objects with this structure:
[
  {
    "code": "EXACT_ITEM_CODE_FROM_RECEIPT",
    "name": "Human readable item name",
    "expiryDate": "YYYY-MM-DD",
    "category": "produce|dairy|meat|pantry",
    "storageType": "refrigerated|room temperature|frozen",
    "notes": "Brief storage tip (max 50 chars)"
  }
}

IMPORTANT: 
- Use the EXACT item code from the receipt as the key
- Include ALL items from the receipt
- Keep notes under 50 characters
- Return ONLY the JSON object`

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 8192,
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
    let items: ExpiryItem[] = []
    if (message.content[0].type === 'text') {
      const responseText = message.content[0].text
      console.log('Raw response:', responseText)
      
      try {
        // Extract JSON from response
        const jsonMatch = responseText.match(/\[[\s\S]*\s*\]/)
        if (!jsonMatch) {
          console.error('No JSON found in response')
          return NextResponse.json(
            { error: 'Invalid response format from AI' },
            { status: 500 }
          )
        }
        // Clean the JSON string
        const cleanedResponse = jsonMatch[0]
          .trim()
          .replace(/,(\s*[}\]])/g, '$1')
          .replace(/\n/g, '')
          .replace(/\s+/g, ' ')
          .replace(/"\s+}/g, '"}')
          .replace(/}\s+"/g, '}"')
        
        items = JSON.parse(cleanedResponse)
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError)
        return NextResponse.json(
          { error: 'Invalid response format from AI' },
          { status: 500 }
        )
      }
    }

    if (items.length === 0) {
      return NextResponse.json({ error: 'Failed to analyze receipt' }, { status: 500 })
    }

    // Sort items by expiry date
    const sortedItems = items
      .sort((a, b) => {
        const dateA = new Date(a.expiryDate)
        const dateB = new Date(b.expiryDate)
        return dateA.getTime() - dateB.getTime()
      })

    return NextResponse.json(sortedItems)
  } catch (error) {
    console.error('Error processing receipt:', error)
    return NextResponse.json(
      { error: 'Failed to process receipt' },
      { status: 500 }
    )
  }
}