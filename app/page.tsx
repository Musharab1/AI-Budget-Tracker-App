'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

const features = [
  { icon: '📊', title: 'Track Every Rupee', desc: 'Log expenses in seconds with smart auto-categorization powered by AI.' },
  { icon: '🤖', title: 'AI Budget Coach', desc: 'Ask anything — "where am I overspending?" — and get real answers based on your data.' },
  { icon: '⚠️', title: 'Budget Warnings', desc: 'Get a friendly nudge before you overspend, not after. Stay ahead of your limits.' },
  { icon: '📱', title: 'Works on Android', desc: 'Install as an app on your phone. No app store needed — just open and add to home screen.' },
  { icon: '🔐', title: 'Your Data, Only Yours', desc: 'Bank-level row security. Your expenses are completely private — even we can\'t see them.' },
  { icon: '💡', title: 'Smart Categories', desc: 'Food, Transport, Shopping, Uni Supplies, Socializing — built around how students actually spend.' },
]

const faqs = [
  { q: '💸 What even IS Paisavo — and why should I care?', a: 'It\'s your personal money assistant, built specifically for students like you. Log your expenses, set a monthly budget, and let the AI tell you exactly where your money is disappearing before it\'s gone. Think of it as your financially responsible friend who never judges you for that third biryani order.' },
  { q: '🍔 I spend most of my money on food. Will this actually help?', a: 'You and literally 61% of students we surveyed! The app tracks your food spending in real-time and warns you when you\'re going overboard — so you can decide whether that shawarma at midnight is really worth it. Spoiler: sometimes it is. We get it.' },
  { q: '📊 I\'ve never tracked expenses before. Is this app for me?', a: '70% of students we surveyed don\'t track their expenses at all. That\'s exactly who this app is built for. No complicated spreadsheets, no financial jargon. Just open the app, tap a button, and you\'re done.' },
  { q: '🤖 What does "AI advice" actually mean?', a: 'It means the app doesn\'t just show you numbers — it talks to you about them. Ask it "how can I save money this month?" and it\'ll give you a real answer based on your actual spending. Over 74% of surveyed students said they\'d use this feature.' },
  { q: '🔐 Is my data actually safe?', a: 'Your data belongs to you, full stop. We use Supabase with Row Level Security — your expense data is completely isolated. No one else can see it, not even us. 74% of students rated data privacy a 9 or 10 out of 10 in importance. We heard you.' },
  { q: '💰 My budget changes every month. Will the app still work?', a: '61% of students in our survey have irregular income — pocket money that varies, part-time gigs, or family top-ups. You can update your monthly budget anytime. Set it at the start of the month and adjust whenever things change.' },
  { q: '🌐 Is the app available in Urdu?', a: 'Right now the interface is in English — which is what 73% of surveyed students preferred. But 27% wanted both English and Urdu, and we\'re listening. Bilingual support is on our roadmap. Watch this space!' },
  { q: '🚀 How do I get started? Is it complicated?', a: 'Nope — it takes about 30 seconds. Tap "Continue with Google," log in, set your monthly budget, and you\'re live. No setup wizard, no tutorials required. Add your first expense and the app takes it from there.' },
]

const stats = [
  { value: '67', label: 'Students Surveyed' },
  { value: '74%', label: 'Want AI Advice' },
  { value: '70%', label: 'Don\'t Track Expenses' },
  { value: '30s', label: 'To Get Started' },
]

export default function LoginPage() {
  const supabase = createClient()
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
  }

  return (
    <div className="min-h-screen bg-[#080810] text-white overflow-x-hidden">

      {/* Ambient background blobs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-purple-900/20 blur-[120px]" />
        <div className="absolute top-[30%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-900/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[30%] w-[400px] h-[400px] rounded-full bg-violet-900/15 blur-[120px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Paisavo" className="w-8 h-8 rounded-full object-cover" />
          <span className="text-lg font-bold tracking-tight">Paisavo</span>
        </div>
        <button
          onClick={handleGoogleLogin}
          className="text-sm bg-white/10 hover:bg-white/20 border border-white/10 px-4 py-2 rounded-full transition-all"
        >
          Sign in
        </button>
      </nav>

      {/* Hero */}
      <section className="relative z-10 text-center px-4 pt-16 pb-24 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-1.5 text-purple-300 text-xs mb-8">
          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
          Built for Pakistani university students
        </div>

        <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-none mb-6">
          Stop wondering
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400">
            where it went.
          </span>
        </h1>

        <p className="text-gray-400 text-lg sm:text-xl max-w-xl mx-auto mb-10 leading-relaxed">
          Paisavo tracks your spending, warns you before you overspend, and gives you AI-powered advice — all in 30 seconds setup.
        </p>

        <button
          onClick={handleGoogleLogin}
          className="inline-flex items-center gap-3 bg-white text-black font-semibold px-8 py-4 rounded-2xl hover:scale-105 transition-transform text-base shadow-2xl shadow-white/10"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google — it's free
        </button>

        <p className="text-gray-600 text-xs mt-4">No credit card. No setup. Just Google login.</p>
      </section>

      {/* Stats bar */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 pb-24">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-white/5 border border-white/8 rounded-2xl p-5 text-center">
              <div className="text-3xl font-black text-white mb-1">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 pb-28">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">Everything you need.</h2>
          <p className="text-gray-500 text-base">Nothing you don't.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div key={f.title} className="bg-white/4 border border-white/8 rounded-2xl p-6 hover:bg-white/7 hover:border-purple-500/30 transition-all group">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="relative z-10 max-w-3xl mx-auto px-4 pb-28">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">Got questions?</h2>
          <p className="text-gray-500 text-base">Straight from 67 real students, just like you.</p>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-white/4 border border-white/8 rounded-2xl overflow-hidden hover:border-purple-500/30 transition-all"
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full text-left px-6 py-5 flex items-center justify-between gap-4"
              >
                <span className="font-semibold text-sm sm:text-base text-white">{faq.q}</span>
                <span className={`text-purple-400 text-xl flex-shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
              </button>
              {openFaq === i && (
                <div className="px-6 pb-5 text-gray-400 text-sm leading-relaxed border-t border-white/8 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-2xl mx-auto px-4 pb-28 text-center">
        <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-500/20 rounded-3xl p-10">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">Ready to take control?</h2>
          <p className="text-gray-400 mb-8">Join students across Pakistan who are finally tracking their money.</p>
          <button
            onClick={handleGoogleLogin}
            className="inline-flex items-center gap-3 bg-white text-black font-semibold px-8 py-4 rounded-2xl hover:scale-105 transition-transform text-base"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Get started for free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 text-center text-gray-600 text-xs pb-10 px-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <img src="/logo.png" alt="Paisavo" className="w-5 h-5 rounded-full object-cover opacity-50" />
          <span>Paisavo</span>
        </div>
        © {new Date().getFullYear()} Paisavo — Built for Pakistani students 🇵🇰 · Your data is private and never shared
      </footer>

    </div>
  )
}