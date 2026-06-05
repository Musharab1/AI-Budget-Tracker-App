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

type Tab = 'home' | 'recurring' | 'history' | 'ai'

export default function Dashboard() {
  const supabase = createClient()
  const router = useRouter()

  // Core state
  const [user, setUser] = useState<any>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [monthlyBudget, setMonthlyBudget] = useState(15000)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('home')

  // Expense form
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [form, setForm] = useState({
    title: '', amount: '', category: 'Food',
    date: new Date().toISOString().split('T')[0], description: '',
  })

  // AI state
  const [aiResponse, setAiResponse] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [showAiChat, setShowAiChat] = useState(false)
  const [chatQuestion, setChatQuestion] = useState('')
  const [aiRequestsLeft, setAiRequestsLeft] = useState(5)

  // Recurring state
  const [recurringExpenses, setRecurringExpenses] = useState<any[]>([])
  const [pendingRecurring, setPendingRecurring] = useState<any[]>([])
  const [showRecurringForm, setShowRecurringForm] = useState(false)
  const [recurringForm, setRecurringForm] = useState({
    title: '', amount: '', category: 'Food', day_of_month: 1
  })

  // History state
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [historyExpenses, setHistoryExpenses] = useState<Expense[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUser(user)
      await fetchExpenses(user.id)
      await fetchAiRequestsLeft(user.id)
      await fetchRecurringExpenses(user.id)
      setLoading(false)
    }
    getUser()
  }, [])

  // ── Data fetchers ──────────────────────────────────────────

  const fetchExpenses = async (userId: string) => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const { data } = await supabase
      .from('expenses').select('*').eq('user_id', userId)
      .gte('date', firstDay).order('date', { ascending: false })
    if (data) setExpenses(data)
  }

  const fetchAiRequestsLeft = async (userId: string) => {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('ai_usage').select('count').eq('user_id', userId).eq('date', today).single()
    setAiRequestsLeft(Math.max(0, 5 - (data?.count || 0)))
  }

  const fetchRecurringExpenses = async (userId: string) => {
    const { data } = await supabase
      .from('recurring_expenses').select('*').eq('user_id', userId).eq('is_active', true)
    if (data) { setRecurringExpenses(data); checkPendingRecurring(data, userId) }
  }

  const checkPendingRecurring = async (recurring: any[], userId: string) => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const { data: thisMonth } = await supabase
      .from('expenses').select('title, amount').eq('user_id', userId).gte('date', firstDay)
    const pending = recurring.filter(r =>
      !thisMonth?.some(e => e.title === r.title && e.amount === r.amount) && now.getDate() >= r.day_of_month
    )
    setPendingRecurring(pending)
  }

  const fetchHistoryExpenses = async (yearMonth: string) => {
    setHistoryLoading(true)
    const [year, month] = yearMonth.split('-')
    const firstDay = `${year}-${month}-01`
    const lastDay = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0]
    const { data } = await supabase
      .from('expenses').select('*').eq('user_id', user.id)
      .gte('date', firstDay).lte('date', lastDay).order('date', { ascending: false })
    if (data) setHistoryExpenses(data)
    setHistoryLoading(false)
  }

  // ── Actions ────────────────────────────────────────────────

  const addExpense = async () => {
    if (!form.title || !form.amount) return
    const { error } = await supabase.from('expenses').insert({
      user_id: user.id, title: form.title, amount: parseFloat(form.amount),
      category: form.category, date: form.date, description: form.description,
    })
    if (!error) {
      await fetchExpenses(user.id)
      setForm({ title: '', amount: '', category: 'Food', date: new Date().toISOString().split('T')[0], description: '' })
      setShowForm(false)
    } else { alert('Error: ' + error.message) }
  }

  const editExpense = async () => {
    if (!editingExpense || !form.title || !form.amount) return
    const { error } = await supabase.from('expenses').update({
      title: form.title, amount: parseFloat(form.amount),
      category: form.category, date: form.date, description: form.description,
    }).eq('id', editingExpense.id)
    if (!error) {
      await fetchExpenses(user.id)
      setEditingExpense(null); setShowForm(false)
      setForm({ title: '', amount: '', category: 'Food', date: new Date().toISOString().split('T')[0], description: '' })
    }
  }

  const deleteExpense = async (id: string) => {
    await supabase.from('expenses').delete().eq('id', id)
    setExpenses(expenses.filter(e => e.id !== id))
  }

  const callAI = async (type: string, question?: string) => {
    setAiLoading(true); setAiResponse('')
    try {
      const res = await fetch('/api/ai', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, expenses, monthlyBudget, question: question || '' })
      })
      const data = await res.json()
      setAiResponse(data.error || data.response)
      if (!data.error) setAiRequestsLeft(prev => Math.max(0, prev - 1))
    } catch { setAiResponse('Something went wrong. Please try again.') }
    setAiLoading(false)
  }

  const confirmRecurring = async (item: any) => {
    await supabase.from('expenses').insert({
      user_id: user.id, title: item.title, amount: item.amount,
      category: item.category, date: new Date().toISOString().split('T')[0],
      description: 'Auto-added from recurring',
    })
    await fetchExpenses(user.id)
    setPendingRecurring(prev => prev.filter(p => p.id !== item.id))
  }

  const addRecurring = async () => {
    if (!recurringForm.title || !recurringForm.amount) return
    await supabase.from('recurring_expenses').insert({
      user_id: user.id, title: recurringForm.title,
      amount: parseFloat(recurringForm.amount),
      category: recurringForm.category, day_of_month: recurringForm.day_of_month,
    })
    setRecurringForm({ title: '', amount: '', category: 'Food', day_of_month: 1 })
    setShowRecurringForm(false)
    await fetchRecurringExpenses(user.id)
  }

  const deleteRecurring = async (id: string) => {
    await supabase.from('recurring_expenses').delete().eq('id', id)
    setRecurringExpenses(prev => prev.filter(r => r.id !== id))
  }

  // ── Derived ────────────────────────────────────────────────

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

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-20">

      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Paisavo" className="w-8 h-8 object-contain rounded-full" />
          <div>
            <h1 className="text-lg font-bold leading-tight">Paisavo</h1>
            <p className="text-gray-400 text-xs">
              {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user?.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold">
              {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || '?'}
            </div>
          )}
          <span className="text-gray-400 text-xs hidden sm:block">
            {user?.user_metadata?.full_name?.split(' ')[0] || 'User'}
          </span>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
            className="text-gray-400 text-xs hover:text-white">Sign out</button>
        </div>
      </div>

      {/* Pending recurring prompt — always visible */}
      {pendingRecurring.length > 0 && (
        <div className="max-w-lg mx-auto px-4 pt-4">
          <div className="bg-yellow-900/20 border border-yellow-700 rounded-2xl p-4">
            <p className="text-yellow-400 text-sm font-semibold mb-3">🔄 Recurring expenses due this month</p>
            <div className="space-y-3">
              {pendingRecurring.map(item => {
                const cat = CATEGORIES.find(c => c.name === item.category)
                return (
                  <div key={item.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span>{cat?.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-white">{item.title}</p>
                        <p className="text-xs text-gray-400">PKR {item.amount.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => confirmRecurring(item)}
                        className="bg-yellow-600 hover:bg-yellow-500 text-white text-xs px-3 py-1.5 rounded-lg">Add ✓</button>
                      <button onClick={() => setPendingRecurring(prev => prev.filter(p => p.id !== item.id))}
                        className="bg-gray-800 text-gray-400 text-xs px-3 py-1.5 rounded-lg">Skip</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab content */}
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">

        {/* ── HOME TAB ── */}
        {activeTab === 'home' && (
          <>
            {/* Budget Overview */}
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
              <div className="w-full bg-gray-800 rounded-full h-3 mb-2">
                <div className={`h-3 rounded-full transition-all ${percentage > 80 ? 'bg-red-500' : percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${percentage}%` }} />
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>{percentage.toFixed(0)}% used</span>
                <span>Budget: PKR {monthlyBudget.toLocaleString()}</span>
              </div>
              {/* Run out date prediction */}
{totalSpent > 0 && (() => {
  const now = new Date()
  const daysElapsed = now.getDate()
  const dailyRate = totalSpent / daysElapsed
  const daysRemaining = remaining / dailyRate
  const runOutDate = new Date(now.getTime() + daysRemaining * 24 * 60 * 60 * 1000)
  const runOutDay = runOutDate.getDate()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()

  if (remaining <= 0) return null

  return (
    <div className={`mt-2 text-xs ${runOutDay < daysInMonth ? 'text-red-400' : 'text-green-400'}`}>
      {runOutDay < daysInMonth
        ? `⚡ At this rate you'll run out on ${runOutDate.toLocaleDateString('default', { month: 'short', day: 'numeric' })}`
        : `✅ At this rate your budget will last the whole month`
      }
    </div>
  )
})()}
              {percentage > 80 && (
                <div className="mt-3 bg-red-900/30 border border-red-800 rounded-xl p-3 text-red-400 text-sm">
                  ⚠️ You've used {percentage.toFixed(0)}% of your budget!
                  <button onClick={() => { setActiveTab('ai'); callAI('warning') }}
                    className="ml-2 text-xs bg-red-800 hover:bg-red-700 text-red-200 px-2 py-1 rounded-lg">
                    Get saving tip
                  </button>
                </div>
              )}
              <div className="mt-4 flex items-center gap-2">
                <span className="text-gray-400 text-sm">Monthly budget:</span>
                <input type="number" value={monthlyBudget}
                  onChange={e => setMonthlyBudget(Number(e.target.value))}
                  className="bg-gray-800 text-white text-sm rounded-lg px-3 py-1 w-28 border border-gray-700" />
              </div>
            </div>

            <SpendingCharts expenses={expenses} />

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

            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h2 className="text-sm font-semibold text-gray-400 mb-4">RECENT EXPENSES ({expenses.length})</h2>
              {expenses.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No expenses yet. Tap + to add your first one!</p>
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
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => {
                              setEditingExpense(expense)
                              setForm({ title: expense.title, amount: expense.amount.toString(), category: expense.category, date: expense.date, description: expense.description || '' })
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
          </>
        )}

        {/* ── RECURRING TAB ── */}
        {activeTab === 'recurring' && (
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-semibold text-gray-400">🔄 RECURRING EXPENSES</h2>
              <button onClick={() => setShowRecurringForm(!showRecurringForm)}
                className="bg-gray-800 hover:bg-gray-700 text-white text-xs px-3 py-2 rounded-xl">+ Add</button>
            </div>

            {showRecurringForm && (
              <div className="space-y-3 mb-5 p-4 bg-gray-800 rounded-xl">
                <input placeholder="Title (e.g. Hostel Rent)"
                  value={recurringForm.title}
                  onChange={e => setRecurringForm({ ...recurringForm, title: e.target.value })}
                  className="w-full bg-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm border border-gray-600" />
                <input type="number" placeholder="Amount in PKR"
                  value={recurringForm.amount}
                  onChange={e => setRecurringForm({ ...recurringForm, amount: e.target.value })}
                  className="w-full bg-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm border border-gray-600" />
                <select value={recurringForm.category}
                  onChange={e => setRecurringForm({ ...recurringForm, category: e.target.value })}
                  className="w-full bg-gray-700 rounded-xl px-4 py-3 text-white text-sm border border-gray-600">
                  {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
                </select>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">Due on day</span>
                  <input type="number" min={1} max={31} value={recurringForm.day_of_month}
                    onChange={e => setRecurringForm({ ...recurringForm, day_of_month: parseInt(e.target.value) })}
                    className="bg-gray-700 rounded-xl px-3 py-2 text-white text-sm border border-gray-600 w-20" />
                  <span className="text-gray-400 text-sm">of each month</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowRecurringForm(false)}
                    className="flex-1 bg-gray-700 rounded-xl py-2 text-gray-400 text-sm">Cancel</button>
                  <button onClick={addRecurring}
                    className="flex-1 bg-green-500 hover:bg-green-600 rounded-xl py-2 text-white text-sm font-semibold">Save</button>
                </div>
              </div>
            )}

            {recurringExpenses.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">
                No recurring expenses yet.<br />Add hostel rent, mobile data, subscriptions...
              </p>
            ) : (
              <div className="space-y-3">
                {recurringExpenses.map(item => {
                  const cat = CATEGORIES.find(c => c.name === item.category)
                  return (
                    <div key={item.id} className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0">
                      <span className="text-xl">{cat?.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-gray-500">Due day {item.day_of_month} · PKR {item.amount.toLocaleString()}</p>
                      </div>
                      <button onClick={() => deleteRecurring(item.id)}
                        className="text-xs text-gray-600 hover:text-red-400">delete</button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── HISTORY TAB ── */}
        {activeTab === 'history' && (
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <h2 className="text-sm font-semibold text-gray-400 mb-4">MONTHLY HISTORY</h2>
            <div className="flex items-center gap-3 mb-5">
              <button onClick={() => {
                const [y, m] = selectedMonth.split('-').map(Number)
                const prev = new Date(y, m - 2)
                const val = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`
                setSelectedMonth(val); fetchHistoryExpenses(val)
              }} className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-xl text-sm">←</button>

              <span className="flex-1 text-center font-semibold text-white">
                {new Date(selectedMonth + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}
              </span>

              <button onClick={() => {
                const [y, m] = selectedMonth.split('-').map(Number)
                const next = new Date(y, m)
                const val = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`
                const now = new Date()
                const current = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
                if (val <= current) { setSelectedMonth(val); fetchHistoryExpenses(val) }
              }} className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-xl text-sm">→</button>
            </div>

            {historyExpenses.length === 0 && !historyLoading && (
              <button onClick={() => fetchHistoryExpenses(selectedMonth)}
                className="w-full bg-gray-800 hover:bg-gray-700 text-gray-400 text-sm py-3 rounded-xl">
                Load {new Date(selectedMonth + '-01').toLocaleString('default', { month: 'long' })} expenses
              </button>
            )}
            {historyLoading && <p className="text-gray-500 text-sm text-center py-4">Loading...</p>}
            {historyExpenses.length > 0 && !historyLoading && (
              <>
                <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-800">
                  <span className="text-xs text-gray-500">{historyExpenses.length} expenses</span>
                  <span className="text-sm font-bold text-white">
                    PKR {historyExpenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}
                  </span>
                </div>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                  {historyExpenses.map(expense => {
                    const cat = CATEGORIES.find(c => c.name === expense.category)
                    return (
                      <div key={expense.id} className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0">
                        <span className="text-xl">{cat?.icon}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{expense.title}</p>
                          <p className="text-xs text-gray-500">{expense.category} · {expense.date}</p>
                        </div>
                        <p className="text-sm font-semibold text-red-400">-PKR {expense.amount.toLocaleString()}</p>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── AI TAB ── */}
        {activeTab === 'ai' && (
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-400">AI ADVISOR 🤖</h2>
                <p className="text-xs text-gray-500 mt-1">{aiRequestsLeft} requests left today</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => callAI('analysis')}
                  disabled={aiLoading || expenses.length === 0 || aiRequestsLeft === 0}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs px-3 py-2 rounded-xl">
                  Analyse spending
                </button>
                <button onClick={() => callAI('summary')}
                  disabled={aiLoading || expenses.length === 0 || aiRequestsLeft === 0}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs px-3 py-2 rounded-xl">
                  Weekly summary
                </button>
              </div>
            </div>

            {aiLoading && (
              <div className="bg-gray-800 rounded-xl p-4 text-gray-400 text-sm animate-pulse">AI is thinking...</div>
            )}
            {aiResponse && !aiLoading && (
              <div className="bg-gray-800 rounded-xl p-4 text-gray-200 text-sm leading-relaxed">{aiResponse}</div>
            )}

            <div className="mt-4">
              <button onClick={() => setShowAiChat(!showAiChat)}
                className="text-xs text-purple-400 hover:text-purple-300">
                {showAiChat ? 'Hide chat ↑' : 'Ask AI a question ↓'}
              </button>
              {showAiChat && (
                <div className="mt-3 flex gap-2">
                  <input placeholder="e.g. Where am I overspending?"
                    value={chatQuestion} onChange={e => setChatQuestion(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && chatQuestion.trim()) { callAI('chat', chatQuestion); setChatQuestion('') } }}
                    className="flex-1 bg-gray-800 rounded-xl px-4 py-2 text-white text-sm placeholder-gray-500 border border-gray-700" />
                  <button onClick={() => { if (chatQuestion.trim()) { callAI('chat', chatQuestion); setChatQuestion('') } }}
                    disabled={aiLoading || aiRequestsLeft === 0}
                    className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-xl">Ask</button>
                </div>
              )}
            </div>

            {aiRequestsLeft === 0 && (
              <div className="mt-3 bg-yellow-900/30 border border-yellow-800 rounded-xl p-3 text-yellow-400 text-xs">
                ⭐ You've used all 5 free AI requests today. Upgrade to Premium for unlimited advice!
              </div>
            )}
          </div>
        )}

      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-40">
        <div className="max-w-lg mx-auto flex items-center">
          {([
            { id: 'home', icon: '🏠', label: 'Home' },
            { id: 'recurring', icon: '🔄', label: 'Recurring' },
            { id: 'history', icon: '📅', label: 'History' },
            { id: 'ai', icon: '🤖', label: 'AI' },
          ] as { id: Tab; icon: string; label: string }[]).map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors ${activeTab === tab.id ? 'text-purple-400' : 'text-gray-600 hover:text-gray-400'}`}>
              <span className="text-xl">{tab.icon}</span>
              <span className="text-xs font-medium">{tab.label}</span>
              {activeTab === tab.id && <div className="w-1 h-1 bg-purple-400 rounded-full mt-0.5" />}
            </button>
          ))}

          {/* Add expense button in the middle */}
          <button onClick={() => setShowForm(true)}
            className="absolute -top-6 left-1/2 -translate-x-1/2 bg-green-500 hover:bg-green-600 text-white rounded-full w-12 h-12 text-2xl shadow-lg flex items-center justify-center border-4 border-gray-950">
            +
          </button>
        </div>
      </div>

      {/* Add/Edit expense modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50">
          <div className="bg-gray-900 rounded-t-3xl p-6 w-full max-w-lg border-t border-gray-800">
            <h2 className="text-lg font-bold mb-6">{editingExpense ? 'Edit Expense' : 'Add Expense'}</h2>
            <div className="space-y-4">
              <div>
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
                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ title })
                          })
                          const data = await res.json()
                          if (data.category) setForm(prev => ({ ...prev, category: data.category }))
                        } catch {}
                      }, 1000)
                    }
                  }}
                  className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 border border-gray-700" />
                <p className="text-xs text-gray-500 mt-1">Category will be suggested automatically</p>
              </div>
              <input type="number" placeholder="Amount in PKR"
                value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 border border-gray-700" />
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white border border-gray-700">
                {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
              </select>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white border border-gray-700" />
              <input placeholder="Description (optional)"
                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 border border-gray-700" />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowForm(false); setEditingExpense(null); setForm({ title: '', amount: '', category: 'Food', date: new Date().toISOString().split('T')[0], description: '' }) }}
                className="flex-1 bg-gray-800 rounded-xl py-3 text-gray-400">Cancel</button>
              <button onClick={editingExpense ? editExpense : addExpense}
                className="flex-1 bg-green-500 rounded-xl py-3 text-white font-semibold">
                {editingExpense ? 'Save Changes' : 'Add Expense'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}