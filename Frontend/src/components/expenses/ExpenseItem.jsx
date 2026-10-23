import { ArrowDownLeft, ArrowUpRight, House, Plane, Popcorn, Utensils } from 'lucide-react'
import { Avatar } from '../ui/Avatar'

const icons = { food: Utensils, travel: Plane, rent: House, entertainment: Popcorn }

export function ExpenseItem({ expense, currentUser }) {
  const Icon = icons[expense.category] || Utensils
  const amountNum = Number(expense.amount) || 0
  const youPaid =
    expense.paid_by === currentUser?.id ||
    expense.paidBy === 'you' ||
    expense.paid_by_name === currentUser?.username

  const groupLabel = expense.group_name || expense.group || 'Personal'
  const formattedDate = expense.created_at
    ? new Date(expense.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : (expense.date || 'Today')

  let shareText = ''
  let isPositive = false

  if (expense.splits && expense.splits.length > 0) {
    const mySplit = expense.splits.find((s) => s.user_id === currentUser?.id)
    if (youPaid) {
      const myShare = mySplit ? Number(mySplit.amount_owed) : (amountNum / expense.splits.length)
      const othersOwe = amountNum - myShare
      isPositive = true
      shareText = `+$${othersOwe.toFixed(2)}`
    } else {
      const iOwe = mySplit ? Number(mySplit.amount_owed) : (amountNum / expense.splits.length)
      isPositive = false
      shareText = `-$${iOwe.toFixed(2)}`
    }
  } else {
    const participantsCount = expense.participants?.length || 1
    const share = amountNum / participantsCount
    if (youPaid) {
      isPositive = true
      shareText = `+$${(amountNum - share).toFixed(2)}`
    } else {
      isPositive = false
      shareText = `-$${share.toFixed(2)}`
    }
  }

  const payerInitials = youPaid
    ? (currentUser?.initials || 'ME')
    : (expense.paid_by_name?.slice(0, 2).toUpperCase() || 'FR')
  const payerName = youPaid
    ? 'You paid'
    : `${expense.paid_by_name || 'Friend'} paid`

  return (
    <div className="group flex items-center gap-3 border-b border-[#edf1ec] py-4 last:border-0">
      <div
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
        style={{
          background:
            expense.category === 'food'
              ? '#fff1e7'
              : expense.category === 'travel'
              ? '#edf2ff'
              : expense.category === 'rent'
              ? '#f5edfb'
              : '#fff7dd',
          color:
            expense.category === 'food'
              ? '#ef7d30'
              : expense.category === 'travel'
              ? '#547bd5'
              : expense.category === 'rent'
              ? '#9d66c5'
              : '#c1922e',
        }}
      >
        <Icon size={18} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-[#2d3b31]">
          {expense.description || 'Expense'}
        </p>
        <p className="mt-0.5 text-xs text-[#89958d]">
          {groupLabel} · {formattedDate}
        </p>
      </div>

      <div className="hidden items-center gap-2 sm:flex">
        <Avatar initials={payerInitials} color={youPaid ? '#b8d9bd' : '#f2b77d'} size="sm" />
        <span className="text-xs text-[#7b887f]">{payerName}</span>
      </div>

      <div className="text-right">
        <p className="text-sm font-bold text-[#2c3b31]">${amountNum.toFixed(2)}</p>
        <p
          className={`mt-0.5 flex items-center justify-end gap-1 text-xs font-semibold ${
            isPositive ? 'text-[#308050]' : 'text-[#c06b28]'
          }`}
        >
          {isPositive ? (
            <>
              <ArrowDownLeft size={12} /> {shareText}
            </>
          ) : (
            <>
              <ArrowUpRight size={12} /> {shareText}
            </>
          )}
        </p>
      </div>
    </div>
  )
}
