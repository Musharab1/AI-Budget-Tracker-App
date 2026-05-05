'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

interface Expense {
  id: string
  title: string
  amount: number
  category: string
  date: string
}

interface Props {
  expenses: Expense[]
}

const CATEGORY_COLORS: { [key: string]: string } = {
  'Food': '#F97316',
  'Transport': '#3B82F6',
  'Shopping': '#EC4899',
  'Uni Supplies': '#8B5CF6',
  'Socializing': '#10B981',
  'Other': '#6B7280',
}

const barTooltipFormatter = (value: number) => [`PKR ${value}`, 'Spent']
const pieTooltipFormatter = (value: number) => `PKR ${value}`
const legendFormatter = (value: string) => (
  <span style={{ color: '#9ca3af', fontSize: '12px' }}>{value}</span>
)

export default function SpendingCharts({ expenses }: Props) {
  const getLast7Days = () => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
      const total = expenses
        .filter(e => e.date === dateStr)
        .reduce((sum, e) => sum + e.amount, 0)
      days.push({ day: dayName, amount: total, date: dateStr })
    }
    return days
  }

  const getCategoryData = () => {
    const breakdown: { [key: string]: number } = {}
    expenses.forEach(e => {
      breakdown[e.category] = (breakdown[e.category] || 0) + e.amount
    })
    return Object.entries(breakdown).map(([name, value]) => ({ name, value }))
  }

  const weeklyData = getLast7Days()
  const categoryData = getCategoryData()

  if (expenses.length === 0) return null

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h2 className="text-sm font-semibold text-gray-400 mb-6">
          SPENDING THIS WEEK
        </h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis
              dataKey="day"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#111827',
                border: '1px solid #374151',
                borderRadius: '12px',
                color: '#f9fafb'
              }}
              formatter={barTooltipFormatter}
            />
            <Bar
              dataKey="amount"
              fill="#8B5CF6"
              radius={[6, 6, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {categoryData.length > 0 && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-sm font-semibold text-gray-400 mb-6">
            CATEGORY BREAKDOWN
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CATEGORY_COLORS[entry.name] || '#6B7280'}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '12px',
                  color: '#f9fafb'
                }}
                formatter={pieTooltipFormatter}
              />
              <Legend formatter={legendFormatter} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}