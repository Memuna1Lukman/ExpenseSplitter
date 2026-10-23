import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react'
import { Avatar } from '../ui/Avatar'

export function DebtSimplificationCard({ transfers = [], users = [], currentUser }) {
  const getUserInfo = (id) => {
    const sId = String(id)
    if (sId === 'you' || sId === String(currentUser?.id)) {
      return {
        name: 'You',
        initials: currentUser?.initials || 'YOU',
        color: '#b8d9bd',
      }
    }
    const found = (users || []).find((u) => String(u.id) === sId)
    if (found) {
      return {
        name: found.username || found.email?.split('@')[0] || `User #${sId}`,
        initials: (found.username || 'U').slice(0, 2).toUpperCase(),
        color: '#f2b77d',
      }
    }
    return {
      name: `User #${sId}`,
      initials: 'FR',
      color: '#9cc5d9',
    }
  }

  return (
    <section className="rounded-2xl border border-[#dce9dd] bg-[#f0f8f0] p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Sparkles size={16} className="text-[#398451]" />
            <h2 className="font-bold text-[#284633]">Simplified debts</h2>
          </div>
          <p className="text-xs text-[#6e8274]">Min-cash-flow found the shortest way to settle up.</p>
        </div>
        <CheckCircle2 className="text-[#4a9a61]" size={19} />
      </div>

      {transfers && transfers.length > 0 ? (
        <div className="space-y-2">
          {transfers.slice(0, 3).map((transfer) => {
            const from = getUserInfo(transfer.from)
            const to = getUserInfo(transfer.to)
            return (
              <div
                className="flex items-center gap-2 rounded-xl border border-[#dfece0] bg-white/70 px-3 py-2.5"
                key={`${transfer.from}-${transfer.to}`}
              >
                <Avatar initials={from.initials} color={from.color} size="sm" />
                <span className="text-xs font-semibold text-[#52665a]">{from.name}</span>
                <ArrowRight size={14} className="text-[#93a99a]" />
                <Avatar initials={to.initials} color={to.color} size="sm" />
                <span className="text-xs font-semibold text-[#52665a]">{to.name}</span>
                <strong className="ml-auto text-sm text-[#28663c]">
                  ${Number(transfer.amount).toFixed(2)}
                </strong>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-[#587261]">Everyone is settled up 🎉</p>
      )}
    </section>
  )
}
