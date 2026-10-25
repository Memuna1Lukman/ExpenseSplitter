import { useState } from 'react'
import { CheckCircle2, Copy, Mail, X } from 'lucide-react'
import { Button } from '../ui/Button'
import { createGroupInvite } from '../../services/expenseService'

export function InviteMemberModal({ group, onClose }) {
  const [email, setEmail] = useState('')
  const [invite, setInvite] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!email.trim() || submitting) return

    setSubmitting(true)
    setError('')
    try {
      const createdInvite = await createGroupInvite(group.id, email.trim())
      setInvite(createdInvite)
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Could not create this invite. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(invite.accept_url)
      setCopied(true)
    } catch {
      setError('Could not copy the link. Select and copy it manually instead.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#173023]/35 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-member-title"
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="invite-member-title" className="text-xl font-bold text-[#21372a]">
              Invite to {group.name}
            </h2>
            <p className="mt-1 text-xs leading-5 text-[#8a978d]">
              They will join only after accepting the invite with this email address.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close invite dialog"
            onClick={onClose}
            className="rounded-xl p-2 text-[#849188] transition hover:bg-[#f2f5f1] focus:outline-none focus:ring-2 focus:ring-[#b9d9bf]"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {error}
          </div>
        )}

        {invite ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#cfe6d3] bg-[#f1f8f2] p-4">
              <div className="flex gap-3">
                <CheckCircle2 className="mt-0.5 shrink-0 text-[#398451]" size={18} />
                <div>
                  <p className="text-sm font-bold text-[#2d5939]">Invite ready</p>
                  <p className="mt-1 text-xs leading-5 text-[#587460]">
                    Share this private link with {invite.invited_email}. It expires in seven days.
                  </p>
                </div>
              </div>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-[#66766c]">Invite link</span>
              <input
                readOnly
                value={invite.accept_url}
                onFocus={(event) => event.target.select()}
                className="w-full rounded-xl border border-[#dfe8df] bg-[#fbfcfa] px-3.5 py-3 text-xs text-[#506056] outline-none"
              />
            </label>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={onClose}>
                Done
              </Button>
              <Button type="button" onClick={copyInviteLink}>
                <Copy size={16} /> {copied ? 'Copied' : 'Copy invite link'}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-[#66766c]">Email address</span>
              <div className="flex items-center rounded-xl border border-[#dfe8df] bg-[#fbfcfa] focus-within:border-[#5a9a6b] focus-within:ring-2 focus-within:ring-[#e1f0e3]">
                <Mail className="ml-3.5 shrink-0 text-[#819087]" size={17} />
                <input
                  required
                  autoFocus
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="friend@example.com"
                  className="w-full bg-transparent px-3 py-3 text-sm outline-none"
                />
              </div>
            </label>
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Creating invite...' : 'Create invite'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
