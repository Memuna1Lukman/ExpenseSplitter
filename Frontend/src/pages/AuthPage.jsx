import { useState } from 'react'
import { ArrowRight, Check, CircleDollarSign, Eye, EyeOff, Sparkles, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '../components/ui/Button'

export function AuthPage({ mode, onModeChange, onSignIn, onSignUp, loading, error, onClearError }) {
  const isSignUp = mode === 'signup'
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })

  const update = (key, value) => {
    if (error && onClearError) onClearError()
    setForm((old) => ({ ...old, [key]: value }))
  }

  const submit = (e) => {
    e.preventDefault()
    if (loading) return
    isSignUp ? onSignUp(form) : onSignIn(form)
  }

  const handleModeSwitch = (newMode) => {
    if (onClearError) onClearError()
    onModeChange(newMode)
  }

  return (
    <main className="app-surface soft-grid flex min-h-screen items-center justify-center p-4 sm:p-8">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[28px] border border-[#e0e9df] bg-[#fbfcfa] shadow-[0_28px_80px_rgba(44,75,53,.12)] lg:grid-cols-[1fr_440px]">
        <section className="relative hidden overflow-hidden bg-[#1d5b3a] p-12 text-white lg:block">
          <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full border-[40px] border-white/10" />
          <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full border-[40px] border-[#8ec59a]/20" />
          <div className="relative flex h-full flex-col">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15">
                <CircleDollarSign size={20} />
              </span>
              <span className="font-bold">splitwise.</span>
            </div>
            <div className="my-auto max-w-md">
              <p className="mb-6 flex items-center gap-2 text-sm font-semibold text-[#b9e0c0]">
                <Sparkles size={16} /> Better together
              </p>
              <h1 className="text-5xl font-bold leading-[1.08] tracking-tight">
                Make money<br />less awkward.
              </h1>
              <p className="mt-6 max-w-sm text-base leading-7 text-[#d2ead5]">
                The friendly way to share expenses, settle up, and keep your friendships uncomplicated.
              </p>
              <div className="mt-10 space-y-4 text-sm text-[#e0f2e2]">
                {[
                  'See who owes what at a glance',
                  'Settle up with fewer transfers',
                  'Everything stays organized',
                ].map((line) => (
                  <div key={line} className="flex items-center gap-3">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-white/15">
                      <Check size={13} />
                    </span>
                    {line}
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-[#a9d1af]">Trusted by friends who split the bill.</p>
          </div>
        </section>

        <section className="p-6 sm:p-10 lg:p-14">
          <div className="mb-9 lg:hidden">
            <div className="flex items-center gap-2.5 text-[#1d5b3a]">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e4f1e5]">
                <CircleDollarSign size={20} />
              </span>
              <span className="font-bold">splitwise.</span>
            </div>
          </div>
          <div className="mb-8">
            <p className="mb-2 text-sm font-semibold text-[#3e8a55]">
              {isSignUp ? 'Start sharing' : 'Welcome back'}
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-[#21372a]">
              {isSignUp ? 'Create your account' : 'Sign in to Splitwise'}
            </h2>
            <p className="mt-2 text-sm text-[#89968d]">
              {isSignUp
                ? 'It only takes a minute to get started.'
                : 'Your shared expenses are waiting for you.'}
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-700">
              <AlertCircle size={16} className="shrink-0 text-red-600" />
              <span>{typeof error === 'string' ? error : 'Authentication failed'}</span>
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            {isSignUp && (
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-[#66766c]">Your name</span>
                <input
                  required
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="Muna Hassan"
                  className="w-full rounded-xl border border-[#dce5dc] bg-white px-3.5 py-3 text-sm outline-none focus:border-[#5a9a6b] focus:ring-2 focus:ring-[#e1f0e3]"
                />
              </label>
            )}
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-[#66766c]">Email address</span>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-[#dce5dc] bg-white px-3.5 py-3 text-sm outline-none focus:border-[#5a9a6b] focus:ring-2 focus:ring-[#e1f0e3]"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-[#66766c]">Password</span>
              <div className="flex items-center rounded-xl border border-[#dce5dc] bg-white focus-within:border-[#5a9a6b] focus-within:ring-2 focus-within:ring-[#e1f0e3]">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent px-3.5 py-3 text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="px-3 text-[#89978d]"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>
            <Button className="mt-2 w-full py-3" type="submit" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  {isSignUp ? 'Creating account...' : 'Signing in...'}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {isSignUp ? 'Create account' : 'Continue'}
                  <ArrowRight size={16} />
                </span>
              )}
            </Button>
          </form>

          <p className="mt-7 text-center text-sm text-[#87948b]">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => handleModeSwitch(isSignUp ? 'signin' : 'signup')}
              className="font-bold text-[#2e7a46] hover:underline"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </section>
      </div>
    </main>
  )
}
