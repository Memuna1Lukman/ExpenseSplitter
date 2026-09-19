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
  const balances = { you: 0, alex: 0, sam: 0, jamie: 0, taylor: 0 }
  expenses.forEach((expense) => {
    const share = expense.amount / expense.participants.length
    expense.participants.forEach((person) => { balances[person] -= share })
    balances[expense.paidBy] += expense.amount
  })
  return balances
}
