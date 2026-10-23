export function simplifyDebts(balances) {
  const creditors = Object.entries(balances).filter(([, value]) => value > 0.005).map(([person, amount]) => ({ person, amount }))
  const debtors = Object.entries(balances).filter(([, value]) => value < -0.005).map(([person, amount]) => ({ person, amount: -amount }))
  const transfers = []
  let i = 0; let j = 0
  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].amount, creditors[j].amount)
    transfers.push({ from: debtors[i].person, to: creditors[j].person, amount: Math.round(amount * 100) / 100 })
    debtors[i].amount -= amount; creditors[j].amount -= amount
    if (debtors[i].amount < 0.005) i++
    if (creditors[j].amount < 0.005) j++
  }
  return transfers
}

export function calculateBalances(expenses) {
  const balances = {}
  if (!expenses || expenses.length === 0) return balances

  expenses.forEach((expense) => {
    const payer = String(expense.paid_by || expense.paidBy || 'you')
    const amount = Number(expense.amount) || 0
    if (balances[payer] === undefined) balances[payer] = 0
    balances[payer] += amount

    if (expense.splits && expense.splits.length > 0) {
      expense.splits.forEach((split) => {
        const uid = String(split.user_id)
        const owed = Number(split.amount_owed) || 0
        if (balances[uid] === undefined) balances[uid] = 0
        balances[uid] -= owed
      })
    } else if (expense.participants && expense.participants.length > 0) {
      const share = amount / expense.participants.length
      expense.participants.forEach((person) => {
        const pid = String(person)
        if (balances[pid] === undefined) balances[pid] = 0
        balances[pid] -= share
      })
    } else {
      balances[payer] -= amount
    }
  })
  return balances
}
