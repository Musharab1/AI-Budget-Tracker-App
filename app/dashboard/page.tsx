'use client'

import SpendingCharts from './components/spendingcharts'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'


const CATEGORIES = [
  { name: 'Food', icon: '🍔', color: 'bg-orange-500' },
  { name: 'Transport', icon: '🚌', color: 'bg-blue-500' },
  { name: 'Shopping', icon: '🛍️', color: 'bg-pink-500' },
  { name: 'Uni Supplies', icon: '📚', color: 'bg-purple-500' },
  { name: 'Socializing', icon: '👥', color: 'bg-green-500' },
  { name: 'Other', icon: '💸', color: 'bg-gray-500' },
]

interface Expense {
  id: string
  title: string
  amount: number
  category: string
  date: string
  description: string
}

export default function Dashboard() {
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [monthlyBudget, setMonthlyBudget] = useState(15000)
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [loading, setLoading] = useState(true)
  const [aiResponse, setAiResponse] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [showAiChat, setShowAiChat] = useState(false)
  const [chatQuestion, setChatQuestion] = useState('')
  const [aiRequestsLeft, setAiRequestsLeft] = useState(5)
  const [form, setForm] = useState({
    title: '',
    amount: '',
    category: 'Food',
    date: new Date().toISOString().split('T')[0],
    description: '',
  })

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUser(user)
      await fetchExpenses(user.id)
      setLoading(false)
    }
    getUser()
  }, [])

  const fetchExpenses = async (userId: string) => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .gte('date', firstDay)
      .order('date', { ascending: false })
    if (data) setExpenses(data)
  }

  const addExpense = async () => {
  if (!form.title || !form.amount) return
  
  
  const { data, error } = await supabase.from('expenses').insert({
    user_id: user.id,
    title: form.title,
    amount: parseFloat(form.amount),
    category: form.category,
    date: form.date,
    description: form.description,
  })
    
  if (!error) {
    await fetchExpenses(user.id)
    setForm({ title: '', amount: '', category: 'Food', date: new Date().toISOString().split('T')[0], description: '' })
    setShowForm(false)
  } else {
    alert('Error: ' + error.message)
  }
}

  const deleteExpense = async (id: string) => {
    await supabase.from('expenses').delete().eq('id', id)
    setExpenses(expenses.filter(e => e.id !== id))
  }

  const callAI = async (type: string, question?: string) => {
  setAiLoading(true)
  setAiResponse('')
  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        expenses,
        monthlyBudget,
        question: question || ''
      })
    })
    const data = await res.json()
    if (data.error) {
      setAiResponse(data.error)
    } else {
      setAiResponse(data.response)
      setAiRequestsLeft(prev => Math.max(0, prev - 1))
    }
  } catch (error) {
    setAiResponse('Something went wrong. Please try again.')
  }
  setAiLoading(false)
  }
  
  const editExpense = async () => {
  if (!editingExpense || !form.title || !form.amount) return
  const { error } = await supabase
    .from('expenses')
    .update({
      title: form.title,
      amount: parseFloat(form.amount),
      category: form.category,
      date: form.date,
      description: form.description,
    })
    .eq('id', editingExpense.id)
  if (!error) {
    await fetchExpenses(user.id)
    setEditingExpense(null)
    setShowForm(false)
    setForm({ title: '', amount: '', category: 'Food', date: new Date().toISOString().split('T')[0], description: '' })
  }
}

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0)
  const remaining = monthlyBudget - totalSpent
  const percentage = Math.min((totalSpent / monthlyBudget) * 100, 100)

  const categoryTotals = CATEGORIES.map(cat => ({
    ...cat,
    total: expenses.filter(e => e.category === cat.name).reduce((sum, e) => sum + e.amount, 0)
  })).filter(c => c.total > 0)

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white text-lg">Loading...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-20">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold">Paisavo 💰</h1>
          <p className="text-gray-400 text-xs">
            {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {user?.user_metadata?.avatar_url ? (
              <img 
              src={user?.user_metadata?.avatar_url} 
              className="w-8 h-8 rounded-full"
              referrerPolicy="no-referrer"
              />
            ) : (
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold">
              {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || '?'}
              </div>
            )}
            <span className="text-gray-400 text-xs hidden sm:block">
              {user?.user_metadata?.full_name?.split(' ')[0] || 'User'}
              </span>
              </div>
            <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
            className="text-gray-400 text-xs hover:text-white">Sign out</button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Budget Overview Card */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-400 text-sm">Total Spent</p>
              <p className="text-3xl font-bold text-white">PKR {totalSpent.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-sm">Remaining</p>
              <p className={`text-xl font-bold ${remaining < 0 ? 'text-red-400' : 'text-green-400'}`}>
                PKR {remaining.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-800 rounded-full h-3 mb-2">
            <div
              className={`h-3 rounded-full transition-all ${percentage > 80 ? 'bg-red-500' : percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>{percentage.toFixed(0)}% used</span>
            <span>Budget: PKR {monthlyBudget.toLocaleString()}</span>
          </div>

          {/* Budget warning */}
          {percentage > 80 && (
            <div className="mt-3 bg-red-900/30 border border-red-800 rounded-xl p-3 text-red-400 text-sm">
              ⚠️ You've used {percentage.toFixed(0)}% of your budget!
              <button
              onClick={() => callAI('warning')}
              disabled={aiLoading}
              className="ml-2 text-xs bg-red-800 hover:bg-red-700 text-red-200 px-2 py-1 rounded-lg">
                Get saving tip
                </button>
                </div>
              )}

          {/* Budget setter */}
          <div className="mt-4 flex items-center gap-2">
            <span className="text-gray-400 text-sm">Monthly budget:</span>
            <input
              type="number"
              value={monthlyBudget}
              onChange={(e) => setMonthlyBudget(Number(e.target.value))}
              className="bg-gray-800 text-white text-sm rounded-lg px-3 py-1 w-28 border border-gray-700"
            />
          </div>
        </div>

        {/* Charts */}
        <SpendingCharts expenses={expenses} />

        {/* Category breakdown */}
        {categoryTotals.length > 0 && (
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <h2 className="text-sm font-semibold text-gray-400 mb-4">SPENDING BY CATEGORY</h2>
            <div className="space-y-3">
              {categoryTotals.map(cat => (
                <div key={cat.name} className="flex items-center gap-3">
                  <span className="text-xl">{cat.icon}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span>{cat.name}</span>
                      <span className="text-gray-400">PKR {cat.total.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${cat.color}`}
                        style={{ width: `${(cat.total / totalSpent) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expense list */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-sm font-semibold text-gray-400 mb-4">
            RECENT EXPENSES ({expenses.length})
          </h2>
          {expenses.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">
              No expenses yet. Add your first one! 👇
            </p>
          ) : (
            <div className="space-y-3">
              {expenses.map(expense => {
                const cat = CATEGORIES.find(c => c.name === expense.category)
                return (
                  <div key={expense.id} className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0">
                    <span className="text-xl">{cat?.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{expense.title}</p>
                      <p className="text-xs text-gray-500">{expense.category} · {expense.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-red-400">-PKR {expense.amount.toLocaleString()}</p>
                      <div className="flex gap-2">
                        <button onClick={() => {
                            setEditingExpense(expense)
                            setForm({
                                title: expense.title,
                                amount: expense.amount.toString(),
                                category: expense.category,
                                date: expense.date,
                                description: expense.description || '',
                            })
                            setShowForm(true)
                        }} className="text-xs text-gray-600 hover:text-blue-400">edit</button>
                        <button onClick={() => deleteExpense(expense.id)}
                            className="text-xs text-gray-600 hover:text-red-400">delete</button>
                    </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      {/* AI Advisor Section */}
<div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
  <div className="flex justify-between items-center mb-4">
    <div>
      <h2 className="text-sm font-semibold text-gray-400">AI ADVISOR 🤖</h2>
      <p className="text-xs text-gray-500 mt-1">{aiRequestsLeft} requests left today</p>
    </div>
    <div className="flex gap-2">
      <button
        onClick={() => callAI('analysis')}
        disabled={aiLoading || expenses.length === 0 || aiRequestsLeft === 0}
        className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs px-3 py-2 rounded-xl">
        Analyse spending
      </button>
      <button
        onClick={() => callAI('summary')}
        disabled={aiLoading || expenses.length === 0 || aiRequestsLeft === 0}
        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs px-3 py-2 rounded-xl">
        Weekly summary
      </button>
    </div>
  </div>

  {/* AI Response */}
  {aiLoading && (
    <div className="bg-gray-800 rounded-xl p-4 text-gray-400 text-sm animate-pulse">
      AI is thinking...
    </div>
  )}
  {aiResponse && !aiLoading && (
    <div className="bg-gray-800 rounded-xl p-4 text-gray-200 text-sm leading-relaxed">
      {aiResponse}
    </div>
  )}

  {/* Chat */}
  <div className="mt-4">
    <button
      onClick={() => setShowAiChat(!showAiChat)}
      className="text-xs text-purple-400 hover:text-purple-300">
      {showAiChat ? 'Hide chat ↑' : 'Ask AI a question ↓'}
    </button>
    {showAiChat && (
      <div className="mt-3 flex gap-2">
        <input
          placeholder="e.g. Where am I overspending?"
          value={chatQuestion}
          onChange={e => setChatQuestion(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && chatQuestion.trim()) {
              callAI('chat', chatQuestion)
              setChatQuestion('')
            }
          }}
          className="flex-1 bg-gray-800 rounded-xl px-4 py-2 text-white text-sm placeholder-gray-500 border border-gray-700"
        />
        <button
          onClick={() => {
            if (chatQuestion.trim()) {
              callAI('chat', chatQuestion)
              setChatQuestion('')
            }
          }}
          disabled={aiLoading || aiRequestsLeft === 0}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-xl">
          Ask
        </button>
      </div>
    )}
  </div>

  {aiRequestsLeft === 0 && (
    <div className="mt-3 bg-yellow-900/30 border border-yellow-800 rounded-xl p-3 text-yellow-400 text-xs">
      ⭐ You've used all 5 free AI requests today. Upgrade to Premium for unlimited advice!
    </div>
  )}
</div>
      {/* Add expense button */}
      <div className="fixed bottom-6 right-6">
        <button onClick={() => setShowForm(true)}
          className="bg-green-500 hover:bg-green-600 text-white rounded-full w-14 h-14 text-2xl shadow-lg flex items-center justify-center">
          +
        </button>
      </div>

      {/* Add expense modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50">
          <div className="bg-gray-900 rounded-t-3xl p-6 w-full max-w-lg border-t border-gray-800">
            <h2 className="text-lg font-bold mb-6">{editingExpense ? 'Edit Expense' : 'Add Expense'}</h2>
            <div className="space-y-4">
              <div className="relative">
                <input placeholder="Title (e.g. Lunch at cafeteria)"
                value={form.title}
                onChange={async (e) => {
                  const title = e.target.value
                  setForm({ ...form, title })
                  if (title.length > 3) {
                    clearTimeout((window as any).catTimer)
                    ;(window as any).catTimer = setTimeout(async () => {
                      try {
                        const res = await fetch('/api/ai/categorize', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ title })
                        })
                        const data = await res.json()
                        if (data.category) {
                          setForm(prev => ({ ...prev, category: data.category }))
                        }
                      } catch {}
                    }, 1000)
                  }
                }}
                className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 border border-gray-700" />
                <p className="text-xs text-gray-500 mt-1">Category will be suggested automatically</p>
                </div>
              <input type="number" placeholder="Amount in PKR "
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 border border-gray-700" />
              <select value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white border border-gray-700">
                {CATEGORIES.map(c => (
                  <option key={c.name} value={c.name}>{c.icon} {c.name}</option>
                ))}
              </select>
              <input type="date" value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white border border-gray-700" />
              <input placeholder="Description (optional)"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 border border-gray-700" />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowForm(false); setEditingExpense(null); setForm({ title: '', amount: '', category: 'Food', date: new Date().toISOString().split('T')[0], description: '' }) }}
                className="flex-1 bg-gray-800 rounded-xl py-3 text-gray-400">
                Cancel
              </button>
              <button onClick={editingExpense ? editExpense : addExpense}
                className="flex-1 bg-green-500 rounded-xl py-3 text-white font-semibold">
                {editingExpense ? 'Save Changes' : 'Add Expense'}
              </button>
            </div>
          </div>
        </div>
      )}
      <footer className="text-center text-sm text-gray-600 py-6 mt-4">
        © {new Date().getFullYear()} Paisavo — Built for Pakistani students 🇵🇰
      </footer>
    </div>   
  )
}

