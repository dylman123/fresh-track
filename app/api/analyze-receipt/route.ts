import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    console.log('Starting receipt analysis...')
    const formData = await request.formData()
    const receipt = formData.get('receipt') as File
    
    // Convert image to base64 immediately
    const bytes = await receipt.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = buffer.toString('base64')

    // Start Claude request but don't await it
    const messagePromise = anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'This is a grocery receipt...' // your existing prompt
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

    // Return a polling endpoint
    return NextResponse.json({ 
      status: 'processing',
      pollUrl: '/api/analyze-receipt/status'
    })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to process receipt' }, { status: 500 })
  }
} 