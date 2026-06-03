import Groq from 'groq-sdk'
import { NextResponse } from 'next/server'


const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })

export async function POST(request: Request) {
  try {
    const { title } = await request.json()
    
    const completion = await groq.chat.completions.create({
      messages: [{
        role: 'user',
        content: `Categorize this expense into exactly ONE of these categories: Food, Transport, Shopping, Uni Supplies, Socializing, Other.
        
Expense: "${title}"

Reply with ONLY the category name, nothing else.`
      }],
      model: 'llama-3.1-8b-instant',
      max_tokens: 10,
    })

    const category = completion.choices[0]?.message?.content?.trim() || 'Other'
    const validCategories = ['Food', 'Transport', 'Shopping', 'Uni Supplies', 'Socializing', 'Other']
    const finalCategory = validCategories.includes(category) ? category : 'Other'

    return NextResponse.json({ category: finalCategory })
  } catch (error: any) {
    return NextResponse.json({ category: 'Other' })
  }
}