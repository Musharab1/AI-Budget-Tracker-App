import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const DAILY_LIMIT = 50

async function checkRateLimit(supabase: any, userId: string): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0]
  
  const { data } = await supabase
    .from('ai_usage')
    .select('count')
    .eq('user_id', userId)
    .eq('date', today)
    .single()

  if (!data) {
    await supabase.from('ai_usage').insert({ user_id: userId, date: today, count: 1 })
    return true
  }

  if (data.count >= DAILY_LIMIT) return false

  await supabase
    .from('ai_usage')
    .update({ count: data.count + 1 })
    .eq('user_id', userId)
    .eq('date', today)

  return true
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const allowed = await checkRateLimit(supabase, user.id)
    if (!allowed) {
      return NextResponse.json({ 
        error: 'Daily limit reached. Upgrade to premium for unlimited AI advice!' 
      }, { status: 429 })
    }

    const { type, expenses, monthlyBudget, question } = await request.json()

    const totalSpent = expenses.reduce((sum: number, e: any) => sum + e.amount, 0)
    const remaining = monthlyBudget - totalSpent
    const percentage = ((totalSpent / monthlyBudget) * 100).toFixed(0)

    const categoryBreakdown = expenses.reduce((acc: any, e: any) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount
      return acc
    }, {})

    const categoryText = Object.entries(categoryBreakdown)
      .map(([cat, amt]) => `${cat}: PKR ${amt}`)
      .join(', ')

    let prompt = ''

    if (type === 'analysis') {
      prompt = `You are a friendly financial advisor for Pakistani university students. 
      
Student's financial snapshot this month:
- Monthly budget: PKR ${monthlyBudget}
- Total spent: PKR ${totalSpent} (${percentage}% of budget)
- Remaining: PKR ${remaining}
- Spending breakdown: ${categoryText}

Give them a warm, friendly spending analysis in 3 parts:
1. One key observation about their biggest spending category
2. One specific actionable tip they can implement TODAY to save money
3. One encouraging sentence

Keep it under 120 words. Write like a smart older sibling — warm, honest, never preachy. 
Use simple English. Occasionally use "yaar" to feel relatable to Pakistani students.
Always mention specific PKR amounts in your advice.`

    } else if (type === 'chat') {
      prompt = `You are a friendly financial advisor for Pakistani university students.

Student's financial snapshot:
- Monthly budget: PKR ${monthlyBudget}
- Total spent: PKR ${totalSpent} (${percentage}% of budget)  
- Remaining: PKR ${remaining}
- Spending breakdown: ${categoryText}

Student's question: "${question}"

Answer their question specifically using their actual spending data.
Be warm, friendly, like a smart older sibling.
Keep response under 100 words.
Use simple English, occasionally use "yaar".
Always give specific PKR amounts when relevant.`

    } else if (type === 'summary') {
      prompt = `You are a friendly financial advisor for Pakistani university students.

Student's weekly spending:
- Total spent: PKR ${totalSpent}
- Budget: PKR ${monthlyBudget}
- Breakdown: ${categoryText}

Create a brief weekly summary with:
1. How they did this week (one sentence)
2. Their top spending category and whether it's reasonable
3. One specific saving tip for next week

Keep it under 100 words. Warm, friendly tone. Use "yaar" occasionally.`
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent(prompt)
    const response = result.response.text()

    return NextResponse.json({ response })

  } catch (error: any) {
    console.error('AI API error:', error)
    return NextResponse.json({ error: 'AI service error: ' + error.message }, { status: 500 })
  }
}