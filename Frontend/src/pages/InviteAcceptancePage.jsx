import { useEffect, useState } from 'react'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { acceptGroupInvite } from '../services/expenseService'

export function InviteAcceptancePage({ token, onContinue }) {
  const [state, setState] = useState('loading')
  const [message, setMessage] = useState('Joining your group…')

  useEffect(() => {
    let active = true

    acceptGroupInvite(token)
      .then(() => {
        if (!active) return
        setState('success')
        setMessage('You are now a member of the group.')
      })
      .catch((error) => {
        if (!active) return
        setState('error')
        setMessage(error.response?.data?.detail || 'We could not accept this invite.')
      })

    return () => {
      active = false
    }
  }, [token])

  const isLoading = state === 'loading'
  const Icon = isLoading ? Loader2 : state === 'success' ? CheckCircle2 : XCircle

  return (
    <main className="app-surface soft-grid flex min-h-screen items-center justify-center p-4">
      <section className="w-full max-w-md rounded-3xl border border-[#e0e9df] bg-white p-8 text-center shadow-[0_28px_80px_rgba(44,75,53,.12)]">
        <div className={`mx-auto grid h-14 w-14 place-items-center rounded-2xl ${
          state === 'success' ? 'bg-[#eaf5eb] text-[#398451]' : state === 'error' ? 'bg-red-50 text-red-600' : 'bg-[#eef4ee] text-[#398451]'
        }`}>
          <Icon size={27} className={isLoading ? 'animate-spin' : ''} />
        </div>
        <h1 className="mt-5 text-xl font-bold text-[#21372a]">
          {isLoading ? 'Accepting your invite' : state === 'success' ? 'You’re in the group' : 'Invite unavailable'}
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#718076]">{message}</p>
        {!isLoading && (
          <Button className="mt-6" onClick={onContinue}>
            {state === 'success' ? 'Continue to your groups' : 'Go to dashboard'}
          </Button>
        )}
      </section>
    </main>
  )
}
